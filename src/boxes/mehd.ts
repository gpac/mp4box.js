import { Log } from '#//log';
import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { MAX_SIZE } from '#/constants';

export class mehdBox extends FullBox {
  static override readonly fourcc = 'mehd' as const;
  box_name = 'MovieExtendsHeaderBox' as const;

  fragment_duration: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.flags & 0x1) {
      Log.warn('BoxParser', 'mehd box incorrectly uses flags set to 1, converting version to 1');
      this.version = 1;
    }
    if (this.version === 1) {
      this.fragment_duration = stream.readUint64();
    } else {
      this.fragment_duration = stream.readUint32();
    }
  }

  /** @bundle writing/mehd.js */
  write(stream: MultiBufferStream) {
    const useVersion1 = this.fragment_duration > MAX_SIZE || this.version === 1;
    this.version = useVersion1 ? 1 : 0;

    this.size = 4;
    this.size += useVersion1 ? 4 : 0; // fragment_duration

    this.flags = 0;
    this.writeHeader(stream);

    if (useVersion1) {
      stream.writeUint64(this.fragment_duration);
    } else {
      stream.writeUint32(this.fragment_duration);
    }
  }
}
