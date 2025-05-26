import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class mfhdBox extends FullBox {
  type = 'mfhd' as const;
  box_name = 'MovieFragmentHeaderBox';

  sequence_number: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.sequence_number = stream.readUint32();
  }

  /** @bundle writing/mfhd.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    this.flags = 0;
    this.size = 4;
    this.writeHeader(stream);
    stream.writeUint32(this.sequence_number);
  }
}
