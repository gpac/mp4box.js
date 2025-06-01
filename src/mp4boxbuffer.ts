export class MP4BoxBuffer extends ArrayBuffer {
  fileStart: number;
  usedBytes?: number;

  static fromArrayBuffer(buffer: ArrayBuffer, fileStart: number): MP4BoxBuffer {
    const mp4BoxBuffer = buffer as MP4BoxBuffer;
    mp4BoxBuffer.fileStart = fileStart;
    return mp4BoxBuffer;
  }
}
