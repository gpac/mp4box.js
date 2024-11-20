import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class tfdtBox extends FullBox {
  baseMediaDecodeTime: number;

  constructor(size?: number) {
    super('tfdt', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.version == 1) {
      this.baseMediaDecodeTime = stream.readUint64();
    } else {
      this.baseMediaDecodeTime = stream.readUint32();
    }
  }

  /** @bundle writing/tdft.js */
  write(stream: MultiBufferStream) {
    const UINT32_MAX = Math.pow(2, 32) - 1;
    // use version 1 if baseMediaDecodeTime does not fit 32 bits
    this.version = this.baseMediaDecodeTime > UINT32_MAX ? 1 : 0;
    this.flags = 0;
    this.size = 4;
    if (this.version === 1) {
      this.size += 4;
    }
    this.writeHeader(stream);
    if (this.version === 1) {
      stream.writeUint64(this.baseMediaDecodeTime);
    } else {
      stream.writeUint32(this.baseMediaDecodeTime);
    }
  }
}
