import type { ClassificationResult, ExtractionResult, Webhook } from "./types";
export interface SensibleSDKOptions {
    debug?: true;
    pollingInterval?: number;
    region?: "us-west-2" | "eu-west-2" | "ca-central-1";
}
export declare class SensibleSDK {
    private readonly options;
    static DEFAULT_WAIT_TIME: number;
    static MAX_WAIT_TIME: number;
    static DEFAULT_POLLING_INTERVAL: number;
    static MAX_POLLING_INTERVAL: number;
    private requestCount;
    private readonly backend;
    private readonly s3;
    constructor(apiKey: string, options?: SensibleSDKOptions);
    extract(params: ExtractParams): Promise<ExtractionRequest>;
    classify(params: ClassificationParams): Promise<ClassificationRequest>;
    private extractionWaitLoop;
    private classificationWaitLoop;
    waitFor(request: ClassificationRequest | ExtractionRequest, timeout?: number): Promise<ClassificationResult | ExtractionResult>;
    generateExcel(requests: ExtractionRequest | ExtractionRequest[]): Promise<{
        url: string;
    }>;
}
type FileDefinition = {
    file: Buffer;
} | {
    url: string;
} | {
    path: string;
};
type DocumentType = {
    documentType: string;
    configurationName?: string;
} | {
    documentTypes: string[];
};
type Options = {
    webhook?: Webhook;
    documentName?: string;
    environment?: string;
};
type ExtractParams = FileDefinition & DocumentType & Options;
type ClassificationParams = {
    file: Buffer;
} | {
    path: string;
};
type ExtractionRequest = {
    type: "extraction";
    id: string;
};
type ClassificationRequest = {
    type: "classification";
    id: string;
    downloadLink: string;
};
export type { ClassificationResult, ExtractionResult, Webhook };
