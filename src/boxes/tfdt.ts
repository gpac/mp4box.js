import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { MAX_SIZE } from '#/constants';

export class tfdtBox extends FullBox {
  static override readonly fourcc = 'tfdt' as const;
  box_name = 'TrackFragmentBaseMediaDecodeTimeBox' as const;

  baseMediaDecodeTime: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.version === 1) {
      this.baseMediaDecodeTime = stream.readUint64();
    } else {
      this.baseMediaDecodeTime = stream.readUint32();
    }
  }

  /** @bundle writing/tdft.js */
  write(stream: MultiBufferStream) {
    // use version 1 if baseMediaDecodeTime does not fit 32 bits
    this.version = this.baseMediaDecodeTime > MAX_SIZE || this.version === 1 ? 1 : 0;
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
