import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import type { Sample } from '#/types';

export class stcoBox extends FullBox {
  chunk_offsets: Array<number>;

  constructor(size?: number) {
    super('stco', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    const entry_count = stream.readUint32();
    this.chunk_offsets = [];
    if (this.version === 0) {
      for (let i = 0; i < entry_count; i++) {
        this.chunk_offsets.push(stream.readUint32());
      }
    }
  }

  /** @bundle writings/stco.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    this.flags = 0;
    this.size = 4 + 4 * this.chunk_offsets!.length;
    this.writeHeader(stream);
    stream.writeUint32(this.chunk_offsets!.length);
    stream.writeUint32Array(this.chunk_offsets!);
  }

  /** @bundle box-unpack.js */
  unpack(samples: Array<Sample>) {
    for (let i = 0; i < this.chunk_offsets!.length; i++) {
      samples[i].offset = this.chunk_offsets![i];
    }
  }
}
