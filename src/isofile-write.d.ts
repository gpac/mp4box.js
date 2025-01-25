declare class ISOFile {
    boxes: any[];
    createFragment(track_id: number, sampleNumber: number, stream_?: DataStream): DataStream | null;
    write(outstream: DataStream): void;
    static writeInitializationSegment(ftyp: any, moov: any, total_duration: number, sample_duration: number): ArrayBuffer;
    save(name: string): void;
    getBuffer(): ArrayBuffer;
    initializeSegmentation(): any[];
}
