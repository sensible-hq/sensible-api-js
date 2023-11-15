/// <reference types="node" />
import type { ClassificationResult, ExtractionResult, Webhook } from "./types";
export declare class SensibleSDK {
    apiKey: string;
    constructor(apiKey: string);
    extract(params: ExtractParams): Promise<ExtractionRequest>;
    classify(params: ClassificationParams): Promise<ClassificationRequest>;
    waitFor(request: ClassificationRequest | ExtractionRequest): Promise<ExtractionResult | ClassificationResult>;
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
