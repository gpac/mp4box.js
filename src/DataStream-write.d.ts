declare class DataStream {
    save(filename: string): void;
    dynamicSize: boolean;
    shift(offset: number): void;
    writeInt32Array(arr: Int32Array, e?: boolean): void;
    writeInt16Array(arr: Int16Array, e?: boolean): void;
    writeInt8Array(arr: Int8Array): void;
    writeUint32Array(arr: Uint32Array, e?: boolean): void;
    writeUint16Array(arr: Uint16Array, e?: boolean): void;
    writeUint8Array(arr: Uint8Array): void;
    writeFloat64Array(arr: Float64Array, e?: boolean): void;
    writeFloat32Array(arr: Float32Array, e?: boolean): void;
    writeInt32(v: number, e?: boolean): void;
    writeInt16(v: number, e?: boolean): void;
    writeInt8(v: number): void;
    writeUint32(v: number, e?: boolean): void;
    writeUint16(v: number, e?: boolean): void;
    writeUint8(v: number): void;
    writeFloat32(v: number, e?: boolean): void;
    writeFloat64(v: number, e?: boolean): void;
    writeUCS2String(str: string, endianness?: boolean, lengthOverride?: number): void;
    writeString(s: string, encoding?: string, length?: number): void;
    writeCString(s: string, length?: number): void;
    writeStruct(structDefinition: any[], struct: any): void;
    writeType(t: any, v: any, struct: any): void;
    writeUint64(v: number): void;
    writeUint24(v: number): void;
    adjustUint32(position: number, value: number): void;
}
