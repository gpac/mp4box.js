import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class smhdBox extends FullBox {
  type = 'smhd' as const;
  box_name = 'SoundMediaHeaderBox';

  balance: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.balance = stream.readUint16();
    stream.readUint16();
  }

  /** @bundle writing/smhd.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    this.flags = 1;
    this.size = 4;
    this.writeHeader(stream);
    stream.writeUint16(this.balance);
    stream.writeUint16(0);
  }
}
