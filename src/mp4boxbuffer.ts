export class MP4BoxBuffer extends ArrayBuffer {
  fileStart: number;
  usedBytes?: number;

  static fromArrayBuffer(buffer: ArrayBuffer): MP4BoxBuffer {
    const mp4BoxBuffer = buffer as MP4BoxBuffer;
    mp4BoxBuffer.fileStart = 0;
    return mp4BoxBuffer;
  }
}
