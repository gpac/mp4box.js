import { FullBox } from '../box';
import type { MultiBufferStream } from '../buffer';

export class mfroBox extends FullBox {
  _size?: number;

  constructor(size?: number) {
    super('mfro', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this._size = stream.readUint32();
  }
}
