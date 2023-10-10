export type ExtractionResult = SingleExtractionResponse | MultiExtractionResponse;
type ExtractionResponseBase = {
    id: string;
    created: string;
    completed?: string;
    status: "FAILED" | "COMPLETE";
    error?: unknown;
    validation_summary?: ValidationSummary;
    page_count?: number;
    document_name?: string;
    environment: string;
    coverage?: number;
};
type SingleExtractionResponse = ExtractionResponseBase & {
    type: string;
    configuration?: string;
    parsed_document?: unknown;
    validations?: DocumentValidationOutput[];
    errors: ExtractionError[];
    classification_summary?: ClassificationSummaryResponse[];
    file_metadata?: FileMetadata;
    webhook?: Webhook;
    download_url?: string;
};
type MultiExtractionResponse = ExtractionResponseBase & {
    types: string[];
    documents?: MultiExtractDocument[];
    webhook?: Webhook;
    download_url?: string;
};
type ValidationSummary = {
    fields: number;
    fields_present: number;
    errors: number;
    warnings: number;
    skipped: number;
};
type DocumentValidationOutput = {
    description: string;
    severity: "warning" | "error" | "skipped";
    message?: string;
};
type ExtractionError = {
    field_id?: string;
    message: string;
    type?: "configuration" | "freeTier" | "invalid" | "unexpected";
};
type ClassificationSummaryResponse = {
    configuration: string;
    fingerprints?: number;
    fingerprints_present?: number;
    score?: {
        value: number;
        fields_present: number;
        penalties: number;
    };
};
type FileMetadata = {
    info?: NormalizedPDFMetadata;
    metadata?: unknown;
    error?: string;
};
type NormalizedPDFMetadata = {
    author?: string;
    title?: string;
    creator?: string;
    producer?: string;
    creation_date?: string;
    modification_date?: string;
    error?: string;
};
type DocConfig = {
    documentType: string;
    configuration: string;
};
type MultiExtractDocument = DocConfig & {
    startPage: number;
    endPage: number;
    output: SingleExtractOutput;
};
type SingleExtractOutput = {
    parsedDocument: unknown;
    configuration: string;
    validations: DocumentValidationOutput[];
    fingerprintMatches?: AnchorPoint[];
    errors: ExtractionError[];
    classificationSummary?: ClassificationSummary[];
    fileMetadata?: FileMetadata;
};
type LineIndex = {
    pageIndex: number;
    lineIndex: number;
};
type TextRange = {
    start: number;
    end: number;
};
type AnchorPoint = LineIndex & {
    textRange: TextRange;
};
type ClassificationSummary = {
    configuration: string;
    fingerprintMatched?: number;
    fingerprintTotal?: number;
    score?: ExtractionScore;
};
type ExtractionScore = {
    score: number;
    fieldsPresent: number;
    penalties: number;
};
export type ClassificationResult = {
    document_type: ClassificationScore;
    reference_documents: ClassificationScore[];
    classification_summary: ClassificationScore[];
};
type ClassificationScore = {
    id: string;
    name: string;
    score: number;
};
export type Webhook = {
    url?: string;
    payload?: Record<string, unknown> | string | number | boolean | Array<unknown>;
};
export {};
