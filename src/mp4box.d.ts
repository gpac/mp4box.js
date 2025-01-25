declare namespace MP4Box {
    function createFile(keepMdatData?: boolean, stream?: any): ISOFile;
}

declare class ISOFile {
    constructor(stream?: any);
    stream: any;
    boxes: any[];
    mdats: any[];
    moofs: any[];
    isProgressive: boolean;
    moovStartFound: boolean;
    onMoovStart: (() => void) | null;
    moovStartSent: boolean;
    onReady: ((info: any) => void) | null;
    readySent: boolean;
    onSegment: ((id: number, user: any, buffer: ArrayBuffer, sampleNum: number, last: boolean) => void) | null;
    onSamples: ((id: number, user: any, samples: any[]) => void) | null;
    onError: ((error: any) => void) | null;
    sampleListBuilt: boolean;
    fragmentedTracks: any[];
    extractedTracks: any[];
    isFragmentationInitialized: boolean;
    sampleProcessingStarted: boolean;
    nextMoofNumber: number;
    itemListBuilt: boolean;
    items: any[];
    entity_groups: any[];
    onSidx: ((sidx: any) => void) | null;
    sidxSent: boolean;
    discardMdatData: boolean;
    setSegmentOptions(id: number, user: any, options?: any): void;
    unsetSegmentOptions(id: number): void;
    setExtractionOptions(id: number, user: any, options?: any): void;
    unsetExtractionOptions(id: number): void;
    parse(): void;
    checkBuffer(ab: ArrayBuffer): boolean;
    appendBuffer(ab: ArrayBuffer, last?: boolean): number | undefined;
    getInfo(): any;
    setNextSeekPositionFromSample(sample: any): void;
    processSamples(last: boolean): void;
    getBox(type: string): any;
    getBoxes(type: string, returnEarly?: boolean): any[];
    getTrackSamplesInfo(track_id: number): any[] | undefined;
    getTrackSample(track_id: number, number: number): any;
    releaseUsedSamples(id: number, sampleNum: number): void;
    start(): void;
    stop(): void;
    flush(): void;
    seekTrack(time: number, useRap: boolean, trak: any): { offset: number; time: number };
    getTrackDuration(trak: any): number;
    seek(time: number, useRap: boolean): { offset: number; time: number };
    equal(b: ISOFile): boolean;
}
