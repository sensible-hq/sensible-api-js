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
var SensibleSDK = /** @class */ (function () {
    function SensibleSDK(apiKey, options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        var _a;
        this.options = options;
        this.requestCount = 1;
        var region = (_a = options.region) !== null && _a !== void 0 ? _a : "us-west-2";
        var subdomain = region === "us-west-2" ? "api" : "api-".concat(region);
        var prefixUrl = "https://".concat(subdomain, ".sensible.so/v0");
        var hooks = {
            beforeRequest: [
                function (options) {
                    var requestId = _this.requestCount++;
                    if (_this.options.debug) {
                        options.context.requestId = requestId;
                        console.info("Request ".concat(requestId, ": ").concat(options.method, " ").concat(options.url));
                    }
                }
            ],
            afterResponse: [
                function (response) {
                    if (_this.options.debug) {
                        var amzRequestid = response.headers["x-amzn-requestid"];
                        var requestId = response.request.options.context.requestId;
                        console.info("Response ".concat(requestId, ": ").concat(response.statusCode).concat(amzRequestid ? " (amz request id: ".concat(amzRequestid, ")") : ""));
                    }
                    return response;
                }
            ],
        };
        this.backend = got_1.default.extend({
            prefixUrl: prefixUrl,
            headers: {
                authorization: "Bearer ".concat(apiKey),
            },
            throwHttpErrors: false,
            hooks: hooks,
        });
        this.s3 = got_1.default.extend({
            headers: {
                "content-type": undefined,
            },
            throwHttpErrors: false,
            hooks: hooks,
        });
    }
    SensibleSDK.prototype.extract = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var webhook, documentName, environment, url, json, response, id, upload_url, file, _a, putResponse;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // This can be called from JS, so we cannot trust the type engine
                        validateExtractParams(params);
                        webhook = params.webhook, documentName = params.documentName, environment = params.environment;
                        url = ("url" in params ? "extract_from_url" : "generate_upload_url") +
                            ("documentType" in params
                                ? "/".concat(params.documentType) +
                                    ("configuration" in params ? "/".concat(params.configurationName) : "")
                                : "") +
                            "?".concat(querystring.stringify(__assign(__assign({}, (environment ? { environment: environment } : {})), (documentName ? { document_name: documentName } : {}))));
                        json = __assign(__assign(__assign({}, ("url" in params ? { document_url: params.url } : {})), (webhook ? { webhook: webhook } : {})), ("documentTypes" in params ? { types: params.documentTypes } : {}));
                        return [4 /*yield*/, this.backend
                                .post(url, {
                                json: json,
                            })];
                    case 1:
                        response = _b.sent();
                        if (response.statusCode !== 200) {
                            throw responseError(response);
                        }
                        if (!("url" in params)) return [3 /*break*/, 2];
                        if (!isExtractionResponse(response)) {
                            throw "Got invalid response from generate_upload_url: ".concat(JSON.stringify(response));
                        }
                        return [2 /*return*/, { type: "extraction", id: response.id }];
                    case 2:
                        if (!isExtractionUrlResponse(response)) {
                            throw "Got invalid response from extract_from_url: ".concat(JSON.stringify(response));
                        }
                        id = response.id, upload_url = response.upload_url;
                        if (!("file" in params)) return [3 /*break*/, 3];
                        _a = params.file;
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, fs_1.promises.readFile(params.path)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5:
                        file = _a;
                        return [4 /*yield*/, this.s3.put(upload_url, {
                                method: "PUT",
                                body: file,
                            })];
                    case 6:
                        putResponse = _b.sent();
                        if (putResponse.statusCode !== 200) {
                            throw responseError(putResponse);
                        }
                        return [2 /*return*/, { type: "extraction", id: id }];
                }
            });
        });
    };
    SensibleSDK.prototype.classify = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var url, file, _a, contentType, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        validateClassificationParams(params);
                        url = "classify/async";
                        if (!("file" in params)) return [3 /*break*/, 1];
                        _a = params.file;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, fs_1.promises.readFile(params.path)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        file = _a;
                        contentType = "application/pdf";
                        return [4 /*yield*/, this.backend
                                .post(url, {
                                body: file,
                                headers: {
                                    "content-type": contentType,
                                },
                            })];
                    case 4:
                        response = _b.sent();
                        if (response.statusCode !== 200) {
                            throw responseError(response);
                        }
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
    SensibleSDK.prototype.extractionWaitLoop = function (id, interval) {
        return __awaiter(this, void 0, void 0, function () {
            var response, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.backend.get("documents/".concat(id))];
                    case 1:
                        response = _a.sent();
                        if (response.statusCode !== 200) {
                            throw responseError(response);
                        }
                        result = response.body;
                        if (result.status == "COMPLETE" || result.status == "FAILED") {
                            return [2 /*return*/, result];
                        }
                        return [4 /*yield*/, sleep(interval)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        if (true) return [3 /*break*/, 0];
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SensibleSDK.prototype.classificationWaitLoop = function (downloadUrl, interval) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.s3.get(downloadUrl)];
                    case 1:
                        response = _a.sent();
                        if (!(response.statusCode === 404)) return [3 /*break*/, 3];
                        return [4 /*yield*/, sleep(interval)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        if (response.statusCode !== 200) {
                            throw responseError(response);
                        }
                        return [2 /*return*/, response.body];
                    case 4:
                        if (true) return [3 /*break*/, 0];
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    SensibleSDK.prototype.waitFor = function (request_1) {
        return __awaiter(this, arguments, void 0, function (request, timeout) {
            var interval, loopPromise;
            var _a;
            if (timeout === void 0) { timeout = SensibleSDK.DEFAULT_WAIT_TIME; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        timeout = Math.min(timeout, SensibleSDK.MAX_WAIT_TIME);
                        interval = Math.min((_a = this.options.pollingInterval) !== null && _a !== void 0 ? _a : SensibleSDK.DEFAULT_POLLING_INTERVAL, SensibleSDK.MAX_POLLING_INTERVAL);
                        loopPromise = request.type === "extraction"
                            ? this.extractionWaitLoop(request.id, interval)
                            : this.classificationWaitLoop(request.downloadLink, interval);
                        return [4 /*yield*/, Promise.race([
                                loopPromise,
                                sleep(timeout).then(function () { throw "Timed out waiting for ".concat(timeout, "ms"); })
                            ])];
                    case 1: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    // requested extractions must be completed
    SensibleSDK.prototype.generateExcel = function (requests) {
        return __awaiter(this, void 0, void 0, function () {
            var extractions, url, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        extractions = Array.isArray(requests) ? requests : [requests];
                        url = "generate_excel/" +
                            extractions.map(function (extraction) { return extraction.id; }).join(",");
                        return [4 /*yield*/, this.backend.get(url)];
                    case 1:
                        response = _a.sent();
                        if (response.statusCode !== 200) {
                            throw responseError(response);
                        }
                        return [2 /*return*/, response.body];
                }
            });
        });
    };
    SensibleSDK.DEFAULT_WAIT_TIME = 60000 * 5; // five minutes
    SensibleSDK.MAX_WAIT_TIME = 60000 * 15; // fifteen minutes
    SensibleSDK.DEFAULT_POLLING_INTERVAL = 5000; // five seconds
    SensibleSDK.MAX_POLLING_INTERVAL = 60000; // one minute
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
    throw responseError(e.response);
}
function responseError(response) {
    switch (response.statusCode) {
        case 400:
            return "Bad Request (400): ".concat(response.body);
        case 401:
            return "Unauthorized (401), please check your API key";
        case 415:
            return "Unsupported Media Type (415), please check your document format";
        case 429:
            // automatic retry?
            return "Too Many Requests (429)";
        case 500:
            return "Internal Server Error (500): ".concat(response.body);
        default:
            return "Unexpected HTTP status code ".concat(response.statusCode, ": ").concat(response.body);
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
