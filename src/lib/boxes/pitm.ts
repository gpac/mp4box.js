import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class pitmBox extends FullBox {
  item_id?: number;

  constructor(size?: number) {
    super('pitm', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.version === 0) {
      this.item_id = stream.readUint16();
    } else {
      this.item_id = stream.readUint32();
    }
  }
}
