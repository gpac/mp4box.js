export class MP4BoxBuffer extends ArrayBuffer {
  fileStart: number;
  usedBytes?: number;

  constructor(byteLength: number) {
    super(byteLength);
    this.fileStart = 0;
    this.usedBytes = 0;
  }

  static fromArrayBuffer(buffer: ArrayBuffer, fileStart: number): MP4BoxBuffer {
    const mp4BoxBuffer = buffer as MP4BoxBuffer;
    mp4BoxBuffer.fileStart = fileStart;
    mp4BoxBuffer.usedBytes = 0;
    return mp4BoxBuffer;
  }
}
