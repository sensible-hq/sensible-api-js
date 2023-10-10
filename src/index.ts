import got, { HTTPError } from "got";
import { type } from "node:os";
import * as querystring from "node:querystring";
import { promisify } from "util";
import { ClassificationResult, ExtractionResult, Webhook } from "./types";

const baseUrl = "https://api.sensible.so/v0";

export class SensibleSDK {
  apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extract(params: ExtractParams): Promise<ExtractionRequest> {
    // This can be called from JS, so we cannot trust the type engine
    validateExtractParams(params);

    const { webhook, documentName, environment } = params;

    const url =
      baseUrl +
      ("url" in params ? "/extract_from_url" : "/generate_upload_url") +
      ("documentType" in params
        ? `/${params.documentType}` +
          ("configuration" in params ? `/${params.configurationName}` : "")
        : "") +
      `?${querystring.stringify({
        ...(environment ? { environment } : {}),
        ...(documentName ? { documentName } : {}),
      })}`;

    const body = {
      ...("url" in params ? { document_url: params.url } : {}),
      ...(webhook ? { webhook } : {}),
      ...("documentTypes" in params ? { types: params.documentTypes } : {}),
    };
    const headers = { authorization: `Bearer ${this.apiKey}` };

    let response;
    try {
      response = await got
        .post(url, {
          json: body,
          headers,
        })
        .json();
    } catch (e: unknown) {
      throwError(e);
    }

    if ("url" in params) {
      if (!isExtractionResponse(response)) {
        throw `Got invalid response from generate_upload_url: ${JSON.stringify(
          response
        )}`;
      }
      return { type: "extraction", id: response.id };
    } else {
      if (!isExtractionUrlResponse(response)) {
        throw `Got invalid response from extract_from_url: ${JSON.stringify(
          response
        )}`;
      }

      const { id, upload_url } = response;

      try {
        const putResponse = await got.put(upload_url, {
          method: "PUT",
          body: params.file,
        });
      } catch (e: any) {
        throw `Error ${e.response.statusCode} uploading file to S3: ${e.response.body}`;
      }

      return { type: "extraction", id };
    }
  }

  async classify(params: ClassificationParams): Promise<ClassificationRequest> {
    validateClassificationParams(params);

    const url = `${baseUrl}/classify/async`;

    let response;
    try {
      response = await got
        .post(url, {
          body: params.file,
          headers: {
            authorization: `Bearer ${this.apiKey}`,
            "content-type": "application/pdf", // HACK
          },
        })
        .json();
    } catch (e: unknown) {
      throwError(e);
    }
    if (!isClassificationResponse(response)) {
      throw `Got invalid response from extract_from_url: ${JSON.stringify(
        response
      )}`;
    }
    return {
      type: "classification",
      id: response.id,
      downloadLink: response.download_link,
    };
  }
  async waitFor(request: ClassificationRequest | ExtractionRequest) {
    // TODO: timeout?
    while (true) {
      if (request.type === "extraction") {
        const response = await got
          .get(`${baseUrl}/documents/${request.id}`, {
            headers: { authorization: `Bearer ${this.apiKey}` },
          })
          .json();
        if (
          response &&
          typeof response === "object" &&
          "status" in response &&
          response.status !== "WAITING"
        ) {
          return response as ExtractionResult;
        }
      } else {
        let response;
        try {
          response = await got.get(request.downloadLink).json();
          return response as ClassificationResult;
        } catch (e: unknown) {
          // 404 is expected while classifying is being done
          if (!(e instanceof HTTPError && e.response.statusCode === 404))
            throwError(e);
        }
      }
      await sleep(5_000); // TODO: parameterize polling interval
    }
  }
}

type FileDefinition = { file: Buffer } | { url: string };
type DocumentType =
  | { documentType: string; configurationName?: string }
  | { documentTypes: string[] };
type Options = {
  webhook?: Webhook;
  documentName?: string;
  environment?: string;
};

type ExtractParams = FileDefinition & DocumentType & Options;

// not exhaustive, backend will take care of the
function validateExtractParams(params: unknown) {
  if (!params || typeof params != "object")
    throw "Invalid extraction parameters: not an object";
  if (
    !(
      ("file" in params && params.file instanceof Buffer) ||
      ("url" in params && typeof params.url === "string")
    )
  )
    throw "Invalid extraction parameters: must include file or url";
  if ("file" in params && "url" in params)
    throw "Invalid extraction parameters: ony one of file or url should be set";
  if (
    !(
      ("documentType" in params && typeof params.documentType === "string") ||
      ("documentTypes" in params &&
        Array.isArray(params.documentTypes) &&
        params.documentTypes.filter(
          (documentType) => typeof documentType === "string"
        ))
    )
  )
    throw "Invalid extraction parameters: must include documentType or documentTypes";
  if ("documentType" in params && "documentTypes" in params)
    throw "Invalid extraction parameters: ony one of documentType or documentTypes should be set";
  if ("documentName" in params && typeof params.documentName !== "string")
    throw "Invalid extraction parameters: documentName should be a string";
  if ("environment" in params && typeof params.environment !== "string")
    throw "Invalid extraction parameters: environment should be a string";
}

type ClassificationParams = { file: Buffer };

function validateClassificationParams(params: unknown) {
  if (
    !(
      params &&
      typeof params === "object" &&
      "file" in params &&
      params.file instanceof Buffer
    )
  )
    throw "Invalid classification params";
}

type ExtractionRequest = {
  type: "extraction";
  id: string;
};

type ClassificationRequest = {
  type: "classification";
  id: string;
  downloadLink: string;
};

const sleep = promisify(setTimeout);

type ExtractionResponse = {
  id: string;
};

type ExtractionUrlResponse = ExtractionResponse & { upload_url: string };

function isExtractionResponse(
  response: unknown
): response is ExtractionResponse {
  return (
    !!response &&
    typeof response === "object" &&
    "id" in response &&
    typeof response.id === "string"
  );
}

function isExtractionUrlResponse(
  response: unknown
): response is ExtractionUrlResponse {
  return (
    isExtractionResponse(response) &&
    "upload_url" in response &&
    typeof response.upload_url === "string"
  );
}

function throwError(e: unknown) {
  if (!(e instanceof HTTPError)) {
    throw `Unknown error ${e}`;
  }

  switch (e.response.statusCode) {
    case 400:
      throw `Bad Request (400): ${e.response.body}`;
    case 401:
      throw "Unauthorized (401), please check your API key";
    case 415:
      throw "Unsupported Media Type (415), please check your document format";
    case 429:
      // automatic retry?
      throw "Too Many Requests (429)";
    case 500:
      throw `Internal Server Error (500): ${e.response.body}`;
    default:
      throw `Got unknown HTTP status code ${e.response.statusCode}: ${e.response.body}`;
  }
}

type ClassificationResponse = { id: string; download_link: string };

function isClassificationResponse(
  response: unknown
): response is ClassificationResponse {
  return (
    !!response &&
    typeof response === "object" &&
    "id" in response &&
    typeof response.id === "string" &&
    "download_link" in response &&
    typeof response.download_link === "string"
  );
}
