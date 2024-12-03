import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class mfroBox extends FullBox {
  type = 'mfro' as const;

  _size: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this._size = stream.readUint32();
  }
}
