import axios from "axios";
import fetch from "cross-fetch";

const defaultColumns = `accession,id,gene_names,protein_name,organism_name,organism_id,length,xref_refseq,xref_geneid,xref_ensembl,go_id,go_p,go_c,go_f,cc_subcellular_location,ft_topo_dom,ft_carbohyd,mass,cc_mass_spectrometry,sequence,ft_var_seq,cc_alternative_products`
const accRegex = /([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2})(-\d+)?/g
const baseUrl: string = "https://rest.uniprot.org/idmapping/run"
const checkStatusUrl: string = "https://rest.uniprot.org/idmapping/status/"



export class Parser {
    pollingInterval: number = 5;
    columns: string = defaultColumns;
    includeIsoform: boolean = false;
    format: string = "tsv";
    resultUrl: ResultLink[] = [];

    constructor(pollingInterval: number = 5, columns: string = defaultColumns, format: string = "tsv", includeIsoform:boolean = false) {
        this.pollingInterval = pollingInterval;
        this.columns = columns;
        this.includeIsoform = includeIsoform;
        this.format = format
    }

    async *parse(ids: string[], segment: number = 10000) {
        const total = ids.length;

        for (let i = 0; i < total; i += segment) {
            try {
                const currentSegment = ids.slice(i, i + segment);
                const res = await axios.post(
                    baseUrl,
                    "ids=" + currentSegment.join(",") + "&from=UniProtKB_AC-ID&to=UniProtKB",
                    {
                        headers: {"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
                        responseType: "json"
                    }
                )
                this.resultUrl.push(new ResultLink(checkStatusUrl + res.data.jobId, this.pollingInterval));
            } catch (e) {
                console.log(e)
            }
        }

        // async generator that yields each result from this.resultUrl
        for await (const result of this.getResult()) {
            yield result;
        }
    }

    async *getResult(): AsyncGenerator<{data:string, total: number}> {
        for await (const url of this.getResultStatus()) {
            let baseData: any
            baseData = {
                "format": this.format,
                "size": 500,
                "fields": this.columns,
                "includeIsoform": this.includeIsoform ? "true" : "false"
            }

            let params: string[] = []
            Object.keys(baseData).forEach(key => {params.push(`${key}=${baseData[key]}`)})

            let nextUrl = undefined;
            try {
                const res = await axios.get(url+"?"+params.join("&"), {responseType: "text"});
                // @ts-ignore
                yield {data: res.data, total: parseInt(res.headers.get("x-total-results"))}
                // @ts-ignore
                nextUrl = res.headers.get("link")
            } catch (e) {
                console.log(e)
            }

            while (true) {
                if (nextUrl !== undefined && nextUrl !== null) {
                    const match = /<(.*)>/.exec(nextUrl);
                    if (match) {
                        const url = match[1];
                        console.log("Next URL: " + url)
                        const resNext = await axios.get(url, {responseType: "text"});
                        // @ts-ignore
                        nextUrl = resNext.headers.get("link")
                        // @ts-ignore
                        yield {data: resNext.data, total: parseInt(resNext.headers.get("x-total-results"))}
                        await new Promise(r => setTimeout(r, 1000));
                    }
                } else {
                    break;
                }
            }
        }
    }

    async *getResultStatus(): AsyncGenerator<string> {
        let complete = this.resultUrl.length;
        while (complete > 0) {
            for (let i = 0; i < this.resultUrl.length; i++) {
                if (!this.resultUrl[i].completed) {
                    try {
                        console.log("Getting status for " + this.resultUrl[i].url)
                        const res = await fetch(this.resultUrl[i].url, {method: "GET", redirect: "manual", headers: {"Accept": "application/json"}});

                        if (res.status == 303) {
                            this.resultUrl[i].completed = true
                            complete--;
                            const location = res.headers.get("Location")
                            if (location) {
                                yield location
                            }
                        } else if (res.status == 400) {
                            console.log("Error: Incorrent URL")
                        } else {
                            if (res.status == 200) {
                                this.resultUrl[i].completed = true
                                complete--;
                                yield res.url
                            } else {
                                console.log("Polling again in " + this.resultUrl[i].pollInterval + " seconds")
                            }
                        }
                    } catch (e: any) {
                        console.log(e)
                    }
                }
            }
            if (complete > 0) {
                await new Promise(r => setTimeout(r, 1000 * this.resultUrl[0].pollInterval));
            }

        }
    }
}

class ResultLink {
    url: string;
    completed: boolean = false;
    pollInterval: number = 5;
    constructor(url: string, pollInterval: number=5) {
        this.url = url;
        this.pollInterval = pollInterval;
    }
}

export class Accession {
    rawAcc: string = "";
    acc: string = "";
    isoform: string = "";

    constructor(rawAcc: string, parseAcc=false) {
        this.rawAcc = rawAcc;
        if (parseAcc) {
            const match = accRegex.exec(rawAcc);
            if (match) {
                this.acc = match[1]
                this.isoform = match[2] ? match[2] : ""
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

