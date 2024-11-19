import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';
import { Log } from '../log';

export class mehdBox extends FullBox {
  fragment_duration?: number;

  constructor(size?: number) {
    super('mehd', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.flags & 0x1) {
      Log.warn('BoxParser', 'mehd box incorrectly uses flags set to 1, converting version to 1');
      this.version = 1;
    }
    if (this.version == 1) {
      this.fragment_duration = stream.readUint64();
    } else {
      this.fragment_duration = stream.readUint32();
    }
  }

  /** @bundle writing/mehd.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    this.flags = 0;
    this.size = 4;
    this.writeHeader(stream);
    stream.writeUint32(this.fragment_duration);
  }
}
