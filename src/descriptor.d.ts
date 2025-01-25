declare class MPEG4DescriptorParser {
    getDescriptorName(tag: number): string;
    parseOneDescriptor(stream: DataStream): Descriptor;
}

declare class Descriptor {
    constructor(tag: number, size: number);
    tag: number;
    size: number;
    descs: Descriptor[];
    data: Uint8Array;
    parse(stream: DataStream): void;
    findDescriptor(tag: number): Descriptor | null;
    parseRemainingDescriptors(stream: DataStream): void;
}

declare class ES_Descriptor extends Descriptor {
    constructor(size: number);
    ES_ID: number;
    flags: number;
    dependsOn_ES_ID: number;
    URL: string;
    OCR_ES_ID: number;
    parse(stream: DataStream): void;
    getOTI(): number;
    getAudioConfig(): number | null;
}

declare class DecoderConfigDescriptor extends Descriptor {
    constructor(size: number);
    oti: number;
    streamType: number;
    upStream: boolean;
    bufferSize: number;
    maxBitrate: number;
    avgBitrate: number;
    parse(stream: DataStream): void;
}

declare class DecoderSpecificInfo extends Descriptor {
    constructor(size: number);
}

declare class SLConfigDescriptor extends Descriptor {
    constructor(size: number);
}
