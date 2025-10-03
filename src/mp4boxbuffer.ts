export class MP4BoxBuffer extends ArrayBuffer {
  fileStart: number;
  usedBytes?: number;

  constructor(byteLength: number) {
    super(byteLength);
    this.fileStart = 0;
    this.usedBytes = 0;
  }

  static fromArrayBuffer(buffer: ArrayBufferLike, fileStart: number): MP4BoxBuffer {
    const mp4BoxBuffer = new MP4BoxBuffer(buffer.byteLength);
    const view = new Uint8Array(mp4BoxBuffer);
    view.set(new Uint8Array(buffer));
    mp4BoxBuffer.fileStart = fileStart;
    return mp4BoxBuffer;
  }
}
