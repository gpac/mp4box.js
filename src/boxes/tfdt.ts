import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { MAX_UINT32 } from '#/constants';

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
    const useVersion1 = this.baseMediaDecodeTime > MAX_UINT32 || this.version === 1;
    this.version = useVersion1 ? 1 : 0;

    this.size = 4;
    this.size += useVersion1 ? 4 : 0;

    this.flags = 0;
    this.writeHeader(stream);

    if (useVersion1) {
      stream.writeUint64(this.baseMediaDecodeTime);
    } else {
      stream.writeUint32(this.baseMediaDecodeTime);
    }
  }
}
