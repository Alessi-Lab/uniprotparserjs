export declare class Parser {
    pollingInterval: number;
    columns: string;
    includeIsoform: boolean;
    format: string;
    resultUrl: ResultLink[];
    constructor(pollingInterval?: number, columns?: string, format?: string, includeIsoform?: boolean);
    parse(ids: string[], segment?: number): AsyncGenerator<{
        data: string;
        total: number;
    }, void, unknown>;
    getResult(): AsyncGenerator<{
        data: string;
        total: number;
    }>;
    getResultStatus(): AsyncGenerator<string>;
}
declare class ResultLink {
    url: string;
    completed: boolean;
    pollInterval: number;
    constructor(url: string, pollInterval?: number);
}
export declare class Accession {
    rawAcc: string;
    acc: string;
    isoform: string;
    constructor(rawAcc: string, parseAcc?: boolean);
    toString(): string;
}
export {};