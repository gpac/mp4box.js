declare namespace BoxParser {
    const ERR_INVALID_DATA: number;
    const ERR_NOT_ENOUGH_DATA: number;
    const OK: number;

    const BASIC_BOXES: string[];
    const FULL_BOXES: string[];
    const CONTAINER_BOXES: [string, string[]?][];

    const boxCodes: string[];
    const fullBoxCodes: string[];
    const containerBoxCodes: string[];
    const sampleEntryCodes: { [key: string]: string[] };
    const sampleGroupEntryCodes: string[];
    const trackGroupTypes: string[];
    const UUIDBoxes: { [key: string]: any };
    const UUIDs: string[];

    function initialize(): void;

    class Box {
        constructor(type: string, size: number, uuid?: string);
        type: string;
        size: number;
        uuid?: string;
        boxes?: Box[];
        subBoxNames?: string[];
        start?: number;
        hdr_size?: number;
        data?: Uint8Array;
        parse(stream: DataStream): void;
        parseDataAndRewind(stream: DataStream): void;
        parseLanguage(stream: DataStream): void;
        add(name: string): Box;
        addBox(box: Box): Box;
        set(prop: string, value: any): Box;
        addEntry(value: any, prop?: string): Box;
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

    class SampleEntry extends Box {
        constructor(type: string, size: number, hdr_size: number, start: number);
        hdr_size: number;
        start: number;
    }

    class SampleGroupEntry {
        constructor(type: string);
        grouping_type: string;
    }

    class TrackGroupTypeBox extends FullBox {
        constructor(type: string, size: number);
    }

    function createBoxCtor(type: string, parseMethod?: (stream: DataStream) => void): void;
    function createFullBoxCtor(type: string, parseMethod?: (stream: DataStream) => void): void;
    function addSubBoxArrays(subBoxNames: string[]): void;
    function createContainerBoxCtor(type: string, parseMethod?: (stream: DataStream) => void, subBoxNames?: string[]): void;
    function createMediaSampleEntryCtor(mediaType: string, parseMethod?: (stream: DataStream) => void, subBoxNames?: string[]): void;
    function createSampleEntryCtor(mediaType: string, type: string, parseMethod?: (stream: DataStream) => void, subBoxNames?: string[]): void;
    function createEncryptedSampleEntryCtor(mediaType: string, type: string, parseMethod?: (stream: DataStream) => void): void;
    function createSampleGroupCtor(type: string, parseMethod?: (stream: DataStream) => void): void;
    function createTrackGroupCtor(type: string, parseMethod?: (stream: DataStream) => void): void;
    function createUUIDBox(uuid: string, isFullBox: boolean, isContainerBox: boolean, parseMethod?: (stream: DataStream) => void): void;

    const TKHD_FLAG_ENABLED: number;
    const TKHD_FLAG_IN_MOVIE: number;
    const TKHD_FLAG_IN_PREVIEW: number;

    const TFHD_FLAG_BASE_DATA_OFFSET: number;
    const TFHD_FLAG_SAMPLE_DESC: number;
    const TFHD_FLAG_SAMPLE_DUR: number;
    const TFHD_FLAG_SAMPLE_SIZE: number;
    const TFHD_FLAG_SAMPLE_FLAGS: number;
    const TFHD_FLAG_DUR_EMPTY: number;
    const TFHD_FLAG_DEFAULT_BASE_IS_MOOF: number;

    const TRUN_FLAGS_DATA_OFFSET: number;
    const TRUN_FLAGS_FIRST_FLAG: number;
    const TRUN_FLAGS_DURATION: number;
    const TRUN_FLAGS_SIZE: number;
    const TRUN_FLAGS_FLAGS: number;
    const TRUN_FLAGS_CTS_OFFSET: number;
}
