export declare const min = 32;
export declare const max = 126;
export declare function makePosition(before?: string, after?: string): string;
export declare function posCodes(str: string): number[];
export declare function pos(codes: number[]): string;
export declare function compare(posA: string, posB: string): number;
