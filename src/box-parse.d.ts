declare namespace BoxParser {
    function parseUUID(stream: DataStream): string;
    function parseHex16(stream: DataStream): string;
    function parseOneBox(stream: DataStream, headerOnly: boolean, parentSize: number): { code: number, box?: Box, size?: number, type?: string, hdr_size?: number, start?: number };
    class Box {
        constructor(type: string, size: number, uuid?: string);
        type: string;
        size: number;
        uuid?: string;
        hdr_size: number;
        start: number;
        data?: Uint8Array;
        parse(stream: DataStream): void;
        parseDataAndRewind(stream: DataStream): void;
        parseLanguage(stream: DataStream): void;
    }
    class FullBox extends Box {
        constructor(type: string, size: number, uuid?: string);
        version: number;
        flags: number;
        parseFullHeader(stream: DataStream): void;
        parse(stream: DataStream): void;
        parseDataAndRewind(stream: DataStream): void;
    }
    class ContainerBox extends Box {
        constructor(type: string, size: number, uuid?: string);
        boxes: Box[];
        parse(stream: DataStream): void;
    }
}
