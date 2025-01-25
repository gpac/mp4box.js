declare class ISOFile {
    lastBoxStartPosition: number;
    parsingMdat: BoxParser.Box | null;
    nextParsePosition: number;
    discardMdatData: boolean;
    processIncompleteBox(ret: any): boolean;
    hasIncompleteMdat(): boolean;
    processIncompleteMdat(): boolean;
    restoreParsePosition(): boolean;
    saveParsePosition(): void;
    updateUsedBytes(box: BoxParser.Box, ret: any): void;
}
