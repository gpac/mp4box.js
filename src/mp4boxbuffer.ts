export class MP4BoxBuffer extends ArrayBuffer {
  fileStart: number;
  usedBytes?: number;

  constructor(byteLength: number) {
    super(byteLength);
    this.fileStart = 0;
    this.usedBytes = 0;
  }

  static fromArrayBuffer(buffer: ArrayBuffer, fileStart: number): MP4BoxBuffer {
    const mp4BoxBuffer = new MP4BoxBuffer(buffer.byteLength);

    const targetView = new Uint8Array(mp4BoxBuffer);
    const sourceView = new Uint8Array(buffer);

    targetView.set(sourceView);

    mp4BoxBuffer.fileStart = fileStart;
    mp4BoxBuffer.usedBytes = 0;

    return mp4BoxBuffer;
  }
}
