declare class ISOFile {
    add(type: string): BoxParser.Box;
    addBox(box: BoxParser.Box): void;
    init(options?: any): ISOFile;
    addTrack(options?: any): number;
    addSample(track_id: number, data: Uint8Array, options?: any): any;
    createSingleSampleMoof(sample: any): BoxParser.moofBox;
}

declare namespace BoxParser {
    class Box {
        add(type: string): Box;
        addBox(box: Box): void;
        set(field: string, value: any): Box;
    }

    class moofBox extends Box {
        trafs: any[];
    }
}
