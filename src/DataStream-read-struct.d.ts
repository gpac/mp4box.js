declare class DataStream {
    readStruct(structDefinition: any[]): any;
    readUCS2String(length: number, endianness: boolean): string;
    readType(t: any, struct: any): any;
}
