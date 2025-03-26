import got, { Got, Hooks, HTTPError, Response } from "got";
import * as querystring from "node:querystring";
import { promises as fs } from "fs";
import { promisify } from "util";
import type { ClassificationResult, ExtractionResult, Webhook } from "./types";


export interface SensibleSDKOptions {
  debug?: true;
  pollingInterval?: number;
  region?: "us-west-2" | "eu-west-2" | "ca-central-1";
}

export class SensibleSDK {
  public static DEFAULT_WAIT_TIME = 60_000 * 5; // five minutes
  public static MAX_WAIT_TIME = 60_000 * 15; // fifteen minutes
  public static DEFAULT_POLLING_INTERVAL = 5_000; // five seconds
  public static MAX_POLLING_INTERVAL = 60_000; // one minute


  private requestCount = 1;
  private readonly backend: Got;
  private readonly s3: Got;

  constructor(apiKey: string, private readonly options: SensibleSDKOptions = {}) {
    const region = options.region ?? "us-west-2";
    const subdomain = region === "us-west-2" ? "api" : `api-${region}`;
    const prefixUrl = `https://${subdomain}.sensible.so/v0`;
    const hooks: Hooks = {
      beforeRequest: [
        (options) => {
          const requestId = this.requestCount++;
          if (this.options.debug) {
            options.context.requestId = requestId;
            console.info(`Request ${requestId}: ${options.method} ${options.url}`);
          }
        }
      ],
      afterResponse: [
        (response) => {
          if (this.options.debug) {
            const amzRequestid = response.headers["x-amzn-requestid"];
            const requestId = response.request.options.context.requestId;
            console.info(`Response ${requestId}: ${response.statusCode}${amzRequestid ? ` (amz request id: ${amzRequestid})` : ""}`);
          }
          return response;
        }
      ],
    };
    this.backend = got.extend({
      prefixUrl,
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
      throwHttpErrors: false,
      hooks,
    });
    this.s3 = got.extend({
      headers: {
        "content-type": undefined,
      },
      throwHttpErrors: false,
      hooks,
    });
  }

  async extract(params: ExtractParams): Promise<ExtractionRequest> {
    // This can be called from JS, so we cannot trust the type engine
    validateExtractParams(params);

    const { webhook, documentName, environment } = params;

    const url =
      ("url" in params ? "extract_from_url" : "generate_upload_url") +
      ("documentType" in params
        ? `/${params.documentType}` +
          ("configuration" in params ? `/${params.configurationName}` : "")
        : "") +
      `?${querystring.stringify({
        ...(environment ? { environment } : {}),
        ...(documentName ? { document_name: documentName } : {}),
      })}`;

    const json = {
      ...("url" in params ? { document_url: params.url } : {}),
      ...(webhook ? { webhook } : {}),
      ...("documentTypes" in params ? { types: params.documentTypes } : {}),
    };

    const response =  await this.backend
      .post<ExtractionResponse>(url, {
        json,
      });

    if (response.statusCode !== 200) {
      throw responseError(response);
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

      const file =
        "file" in params ? params.file : await fs.readFile(params.path);

      
      const putResponse = await this.s3.put(upload_url, {
        method: "PUT",
        body: file,
      });

      if (putResponse.statusCode !== 200) {
        throw responseError(putResponse);
      }

      return { type: "extraction", id };
    }
  }

  async classify(params: ClassificationParams): Promise<ClassificationRequest> {
    validateClassificationParams(params);

    const url = `classify/async`;

    const file =
      "file" in params ? params.file : await fs.readFile(params.path);
    const contentType = "application/pdf";

    const response =  await this.backend
      .post<ClassificationResponse>(url, {
        body: file,
        headers: {
          "content-type": contentType,
        },
      });
    
    if (response.statusCode !== 200) {
      throw responseError(response);
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

  private async extractionWaitLoop(id: string, interval: number): Promise<ExtractionResult> {
    do {
      const response =
        await this.backend.get<ExtractionResult>(`documents/${id}`);
      if (response.statusCode !== 200) {
        throw responseError(response);
      }
      const result = response.body;
      if (result.status == "COMPLETE" || result.status == "FAILED") {
        return result;
      }
      await sleep(interval);
    } while (true);
  }

  private async classificationWaitLoop(downloadUrl: string, interval: number): Promise<ClassificationResult> {
    do {
      const response =
        await this.s3.get<ClassificationResult>(downloadUrl);
      if (response.statusCode === 404) {
        await sleep(interval);
        continue;
      }
      if (response.statusCode !== 200) {
        throw responseError(response);
      }
      return response.body;
    } while (true);
  }

  async waitFor(
    request: ClassificationRequest | ExtractionRequest,
    timeout = SensibleSDK.DEFAULT_WAIT_TIME
  ): Promise<ClassificationResult | ExtractionResult> {
    timeout = Math.min(timeout, SensibleSDK.MAX_WAIT_TIME);
    const interval = Math.min(
      this.options.pollingInterval ?? SensibleSDK.DEFAULT_POLLING_INTERVAL,
      SensibleSDK.MAX_POLLING_INTERVAL
    );
    const loopPromise = request.type === "extraction"
      ? this.extractionWaitLoop(request.id, interval)
      : this.classificationWaitLoop(request.downloadLink, interval);

    return await Promise.race([
        loopPromise,
        sleep(timeout).then(() => { throw `Timed out waiting for ${timeout}ms` })
      ]);
  }

  // requested extractions must be completed
  async generateExcel(
    requests: ExtractionRequest | ExtractionRequest[]
  ): Promise<{ url: string }> {
    const extractions = Array.isArray(requests) ? requests : [requests];

    const url =
      "generate_excel/" +
      extractions.map((extraction) => extraction.id).join(",");
    const response = await this.backend.get<{ url: string; }>(url);
    if (response.statusCode !== 200) {
      throw responseError(response);
    }
    return response.body;
  }
}

type FileDefinition = { file: Buffer } | { url: string } | { path: string };
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
      ("url" in params && typeof params.url === "string") ||
      ("path" in params && typeof params.path === "string")
    )
  )
    throw "Invalid extraction parameters: must include file, url or path";
  if (
    ["file" in params, "url" in params, "path" in params].filter((x) => x)
      .length !== 1
  )
    throw "Invalid extraction parameters: only one of file, url or path should be set";
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

type ClassificationParams = { file: Buffer } | { path: string };

function validateClassificationParams(params: unknown) {
  if (
    !(
      params &&
      typeof params === "object" &&
      (("file" in params && params.file instanceof Buffer) ||
        ("path" in params && typeof params.path === "string"))
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

  throw responseError(e.response);
}

function responseError(response: Response<unknown>): string {
  switch (response.statusCode) {
    case 400:
      return `Bad Request (400): ${response.body}`;
    case 401:
      return "Unauthorized (401), please check your API key";
    case 415:
      return "Unsupported Media Type (415), please check your document format";
    case 429:
      // automatic retry?
      return "Too Many Requests (429)";
    case 500:
      return `Internal Server Error (500): ${response.body}`;
    default:
      return `Unexpected HTTP status code ${response.statusCode}: ${response.body}`;
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

export type { ClassificationResult, ExtractionResult, Webhook };
