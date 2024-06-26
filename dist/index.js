"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SensibleSDK = void 0;
var got_1 = require("got");
var querystring = require("node:querystring");
var fs_1 = require("fs");
var util_1 = require("util");
var baseUrl = "https://api.sensible.so/v0";
var SensibleSDK = /** @class */ (function () {
    function SensibleSDK(apiKey) {
        this.apiKey = apiKey;
    }
    SensibleSDK.prototype.extract = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var webhook, documentName, environment, url, body, headers, response, e_1, id, upload_url, file, _a, putResponse, e_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // This can be called from JS, so we cannot trust the type engine
                        validateExtractParams(params);
                        webhook = params.webhook, documentName = params.documentName, environment = params.environment;
                        url = baseUrl +
                            ("url" in params ? "/extract_from_url" : "/generate_upload_url") +
                            ("documentType" in params
                                ? "/".concat(params.documentType) +
                                    ("configuration" in params ? "/".concat(params.configurationName) : "")
                                : "") +
                            "?".concat(querystring.stringify(__assign(__assign({}, (environment ? { environment: environment } : {})), (documentName ? { document_name: documentName } : {}))));
                        body = __assign(__assign(__assign({}, ("url" in params ? { document_url: params.url } : {})), (webhook ? { webhook: webhook } : {})), ("documentTypes" in params ? { types: params.documentTypes } : {}));
                        headers = { authorization: "Bearer ".concat(this.apiKey) };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, got_1.default
                                .post(url, {
                                json: body,
                                headers: headers,
                            })
                                .json()];
                    case 2:
                        response = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _b.sent();
                        throwError(e_1);
                        return [3 /*break*/, 4];
                    case 4:
                        if (!("url" in params)) return [3 /*break*/, 5];
                        if (!isExtractionResponse(response)) {
                            throw "Got invalid response from generate_upload_url: ".concat(JSON.stringify(response));
                        }
                        return [2 /*return*/, { type: "extraction", id: response.id }];
                    case 5:
                        if (!isExtractionUrlResponse(response)) {
                            throw "Got invalid response from extract_from_url: ".concat(JSON.stringify(response));
                        }
                        id = response.id, upload_url = response.upload_url;
                        if (!("file" in params)) return [3 /*break*/, 6];
                        _a = params.file;
                        return [3 /*break*/, 8];
                    case 6: return [4 /*yield*/, fs_1.promises.readFile(params.path)];
                    case 7:
                        _a = _b.sent();
                        _b.label = 8;
                    case 8:
                        file = _a;
                        _b.label = 9;
                    case 9:
                        _b.trys.push([9, 11, , 12]);
                        return [4 /*yield*/, got_1.default.put(upload_url, {
                                method: "PUT",
                                body: file,
                            })];
                    case 10:
                        putResponse = _b.sent();
                        return [3 /*break*/, 12];
                    case 11:
                        e_2 = _b.sent();
                        throw "Error ".concat(e_2.response.statusCode, " uploading file to S3: ").concat(e_2.response.body);
                    case 12: return [2 /*return*/, { type: "extraction", id: id }];
                }
            });
        });
    };
    SensibleSDK.prototype.classify = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var url, file, _a, response, e_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        validateClassificationParams(params);
                        url = "".concat(baseUrl, "/classify/async");
                        if (!("file" in params)) return [3 /*break*/, 1];
                        _a = params.file;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, fs_1.promises.readFile(params.path)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        file = _a;
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, got_1.default
                                .post(url, {
                                body: file,
                                headers: {
                                    authorization: "Bearer ".concat(this.apiKey),
                                    "content-type": "application/pdf", // HACK
                                },
                            })
                                .json()];
                    case 5:
                        response = _b.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        e_3 = _b.sent();
                        throwError(e_3);
                        return [3 /*break*/, 7];
                    case 7:
                        if (!isClassificationResponse(response)) {
                            throw "Got invalid response from extract_from_url: ".concat(JSON.stringify(response));
                        }
                        return [2 /*return*/, {
                                type: "classification",
                                id: response.id,
                                downloadLink: response.download_link,
                            }];
                }
            });
        });
    };
    SensibleSDK.prototype.waitFor = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var response, response, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!true) return [3 /*break*/, 8];
                        if (!(request.type === "extraction")) return [3 /*break*/, 2];
                        return [4 /*yield*/, got_1.default
                                .get("".concat(baseUrl, "/documents/").concat(request.id), {
                                headers: { authorization: "Bearer ".concat(this.apiKey) },
                            })
                                .json()];
                    case 1:
                        response = _a.sent();
                        if (response &&
                            typeof response === "object" &&
                            "status" in response &&
                            response.status !== "WAITING") {
                            return [2 /*return*/, response];
                        }
                        return [3 /*break*/, 6];
                    case 2:
                        response = void 0;
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, got_1.default.get(request.downloadLink).json()];
                    case 4:
                        response = _a.sent();
                        return [2 /*return*/, response];
                    case 5:
                        e_4 = _a.sent();
                        // 404 is expected while classifying is being done
                        if (!(e_4 instanceof got_1.HTTPError && e_4.response.statusCode === 404))
                            throwError(e_4);
                        return [3 /*break*/, 6];
                    case 6: return [4 /*yield*/, sleep(5000)];
                    case 7:
                        _a.sent(); // TODO: parameterize polling interval
                        return [3 /*break*/, 0];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    // requested extractions must be completed
    SensibleSDK.prototype.generateExcel = function (requests) {
        return __awaiter(this, void 0, void 0, function () {
            var extractions, url, e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        extractions = Array.isArray(requests) ? requests : [requests];
                        url = baseUrl +
                            "/generate_excel/" +
                            extractions.map(function (extraction) { return extraction.id; }).join(",");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, got_1.default
                                .get(url, {
                                headers: { authorization: "Bearer ".concat(this.apiKey) },
                            })
                                .json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        e_5 = _a.sent();
                        throwError(e_5);
                        // HACK: keep TS happy
                        throw null;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return SensibleSDK;
}());
exports.SensibleSDK = SensibleSDK;
// not exhaustive, backend will take care of the
function validateExtractParams(params) {
    if (!params || typeof params != "object")
        throw "Invalid extraction parameters: not an object";
    if (!(("file" in params && params.file instanceof Buffer) ||
        ("url" in params && typeof params.url === "string") ||
        ("path" in params && typeof params.path === "string")))
        throw "Invalid extraction parameters: must include file, url or path";
    if (["file" in params, "url" in params, "path" in params].filter(function (x) { return x; })
        .length !== 1)
        throw "Invalid extraction parameters: only one of file, url or path should be set";
    if (!(("documentType" in params && typeof params.documentType === "string") ||
        ("documentTypes" in params &&
            Array.isArray(params.documentTypes) &&
            params.documentTypes.filter(function (documentType) { return typeof documentType === "string"; }))))
        throw "Invalid extraction parameters: must include documentType or documentTypes";
    if ("documentType" in params && "documentTypes" in params)
        throw "Invalid extraction parameters: ony one of documentType or documentTypes should be set";
    if ("documentName" in params && typeof params.documentName !== "string")
        throw "Invalid extraction parameters: documentName should be a string";
    if ("environment" in params && typeof params.environment !== "string")
        throw "Invalid extraction parameters: environment should be a string";
}
function validateClassificationParams(params) {
    if (!(params &&
        typeof params === "object" &&
        (("file" in params && params.file instanceof Buffer) ||
            ("path" in params && typeof params.path === "string"))))
        throw "Invalid classification params";
}
var sleep = (0, util_1.promisify)(setTimeout);
function isExtractionResponse(response) {
    return (!!response &&
        typeof response === "object" &&
        "id" in response &&
        typeof response.id === "string");
}
function isExtractionUrlResponse(response) {
    return (isExtractionResponse(response) &&
        "upload_url" in response &&
        typeof response.upload_url === "string");
}
function throwError(e) {
    if (!(e instanceof got_1.HTTPError)) {
        throw "Unknown error ".concat(e);
    }
    switch (e.response.statusCode) {
        case 400:
            throw "Bad Request (400): ".concat(e.response.body);
        case 401:
            throw "Unauthorized (401), please check your API key";
        case 415:
            throw "Unsupported Media Type (415), please check your document format";
        case 429:
            // automatic retry?
            throw "Too Many Requests (429)";
        case 500:
            throw "Internal Server Error (500): ".concat(e.response.body);
        default:
            throw "Got unknown HTTP status code ".concat(e.response.statusCode, ": ").concat(e.response.body);
    }
}
function isClassificationResponse(response) {
    return (!!response &&
        typeof response === "object" &&
        "id" in response &&
        typeof response.id === "string" &&
        "download_link" in response &&
        typeof response.download_link === "string");
}
