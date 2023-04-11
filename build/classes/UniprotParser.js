"use strict";
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Accession = exports.Parser = void 0;
const axios_1 = __importDefault(require("axios"));
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const defaultColumns = `accession,id,gene_names,protein_name,organism_name,organism_id,length,xref_refseq,xref_geneid,xref_ensembl,go_id,go_p,go_c,go_f,cc_subcellular_location,ft_topo_dom,ft_carbohyd,mass,cc_mass_spectrometry,sequence,ft_var_seq,cc_alternative_products`;
const accRegex = /([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2})(-\d+)?/g;
const baseUrl = "https://rest.uniprot.org/idmapping/run";
const checkStatusUrl = "https://rest.uniprot.org/idmapping/status/";
class Parser {
    constructor(pollingInterval = 5, columns = defaultColumns, format = "tsv", includeIsoform = false) {
        this.pollingInterval = 5;
        this.columns = defaultColumns;
        this.includeIsoform = false;
        this.format = "tsv";
        this.resultUrl = [];
        this.pollingInterval = pollingInterval;
        this.columns = columns;
        this.includeIsoform = includeIsoform;
        this.format = format;
    }
    parse(ids, segment = 10000) {
        return __asyncGenerator(this, arguments, function* parse_1() {
            var _a, e_1, _b, _c;
            const total = ids.length;
            for (let i = 0; i < total; i += segment) {
                try {
                    const currentSegment = ids.slice(i, i + segment);
                    const res = yield __await(axios_1.default.post(baseUrl, "ids=" + currentSegment.join(",") + "&from=UniProtKB_AC-ID&to=UniProtKB", {
                        headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
                        responseType: "json"
                    }));
                    this.resultUrl.push(new ResultLink(checkStatusUrl + res.data.jobId, this.pollingInterval));
                }
                catch (e) {
                    console.log(e);
                }
            }
            try {
                // async generator that yields each result from this.resultUrl
                for (var _d = true, _e = __asyncValues(this.getResult()), _f; _f = yield __await(_e.next()), _a = _f.done, !_a;) {
                    _c = _f.value;
                    _d = false;
                    try {
                        const result = _c;
                        yield yield __await(result);
                    }
                    finally {
                        _d = true;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield __await(_b.call(_e));
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
    getResult() {
        return __asyncGenerator(this, arguments, function* getResult_1() {
            var _a, e_2, _b, _c;
            try {
                for (var _d = true, _e = __asyncValues(this.getResultStatus()), _f; _f = yield __await(_e.next()), _a = _f.done, !_a;) {
                    _c = _f.value;
                    _d = false;
                    try {
                        const url = _c;
                        let baseData;
                        baseData = {
                            "format": this.format,
                            "size": 500,
                            "fields": this.columns,
                            "includeIsoform": this.includeIsoform ? "true" : "false"
                        };
                        let params = [];
                        Object.keys(baseData).forEach(key => { params.push(`${key}=${baseData[key]}`); });
                        let nextUrl = undefined;
                        try {
                            const res = yield __await(axios_1.default.get(url + "?" + params.join("&"), { responseType: "text" }));
                            // @ts-ignore
                            yield yield __await({ data: res.data, total: parseInt(res.headers.get("x-total-results")) }
                            // @ts-ignore
                            );
                            // @ts-ignore
                            nextUrl = res.headers.get("link");
                        }
                        catch (e) {
                            console.log(e);
                        }
                        while (true) {
                            if (nextUrl !== undefined && nextUrl !== null) {
                                const match = /<(.*)>/.exec(nextUrl);
                                if (match) {
                                    const url = match[1];
                                    console.log("Next URL: " + url);
                                    const resNext = yield __await(axios_1.default.get(url, { responseType: "text" }));
                                    // @ts-ignore
                                    nextUrl = resNext.headers.get("link");
                                    // @ts-ignore
                                    yield yield __await({ data: resNext.data, total: parseInt(resNext.headers.get("x-total-results")) });
                                    yield __await(new Promise(r => setTimeout(r, 1000)));
                                }
                            }
                            else {
                                break;
                            }
                        }
                    }
                    finally {
                        _d = true;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield __await(_b.call(_e));
                }
                finally { if (e_2) throw e_2.error; }
            }
        });
    }
    getResultStatus() {
        return __asyncGenerator(this, arguments, function* getResultStatus_1() {
            let complete = this.resultUrl.length;
            while (complete > 0) {
                for (let i = 0; i < this.resultUrl.length; i++) {
                    if (!this.resultUrl[i].completed) {
                        try {
                            console.log("Getting status for " + this.resultUrl[i].url);
                            const res = yield __await((0, cross_fetch_1.default)(this.resultUrl[i].url, { method: "GET", redirect: "manual", headers: { "Accept": "application/json" } }));
                            if (res.status == 303) {
                                this.resultUrl[i].completed = true;
                                complete--;
                                const location = res.headers.get("Location");
                                if (location) {
                                    yield yield __await(location);
                                }
                            }
                            else if (res.status == 400) {
                                console.log("Error: Incorrent URL");
                            }
                            else {
                                if (res.status == 200) {
                                    this.resultUrl[i].completed = true;
                                    complete--;
                                    yield yield __await(res.url);
                                }
                                else {
                                    console.log("Polling again in " + this.resultUrl[i].pollInterval + " seconds");
                                }
                            }
                        }
                        catch (e) {
                            console.log(e);
                        }
                    }
                }
                if (complete > 0) {
                    yield __await(new Promise(r => setTimeout(r, 1000 * this.resultUrl[0].pollInterval)));
                }
            }
        });
    }
}
exports.Parser = Parser;
class ResultLink {
    constructor(url, pollInterval = 5) {
        this.completed = false;
        this.pollInterval = 5;
        this.url = url;
        this.pollInterval = pollInterval;
    }
}
class Accession {
    constructor(rawAcc, parseAcc = false) {
        this.rawAcc = "";
        this.acc = "";
        this.isoform = "";
        this.rawAcc = rawAcc;
        if (parseAcc) {
            const match = accRegex.exec(rawAcc);
            if (match) {
                this.acc = match[1];
                this.isoform = match[2] ? match[2] : "";
            }
        }
    }
    toString() {
        if (this.isoform !== "") {
            return this.rawAcc + "-" + this.isoform;
        }
        return this.acc;
    }
}
exports.Accession = Accession;
