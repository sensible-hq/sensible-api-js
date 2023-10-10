/// <reference types="node" />
import { ClassificationResult, ExtractionResult, Webhook } from "./types";
export declare class SensibleSDK {
    apiKey: string;
    constructor(apiKey: string);
    extract(params: ExtractParams): Promise<ExtractionRequest>;
    classify(params: ClassificationParams): Promise<ClassificationRequest>;
    waitFor(request: ClassificationRequest | ExtractionRequest): Promise<ExtractionResult | ClassificationResult>;
}
type FileDefinition = {
    file: Buffer;
} | {
    url: string;
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
export {};
