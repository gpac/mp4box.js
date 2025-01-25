declare class MP4Buffer {
    static allocate(size: number): ArrayBuffer;
    static concat(buffer1: ArrayBuffer, buffer2: ArrayBuffer): ArrayBuffer;
    static duplicate(buffer: ArrayBuffer): ArrayBuffer;
    static toString(buffer: ArrayBuffer): string;
    static toHex(buffer: ArrayBuffer): string;
    static toBase64(buffer: ArrayBuffer): string;
    static fromBase64(base64: string): ArrayBuffer;
    static fromHex(hex: string): ArrayBuffer;
    static fromString(str: string): ArrayBuffer;
    static fromUint8Array(uint8Array: Uint8Array): ArrayBuffer;
    static toUint8Array(buffer: ArrayBuffer): Uint8Array;
    static toArrayBuffer(buffer: Buffer): ArrayBuffer;
    static toBuffer(arrayBuffer: ArrayBuffer): Buffer;
    static toArrayBufferView(buffer: Buffer): ArrayBufferView;
    static toBufferView(arrayBufferView: ArrayBufferView): Buffer;
}
