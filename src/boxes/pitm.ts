import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class pitmBox extends FullBox {
  static fourcc = 'pitm' as const;
  box_name = 'PrimaryItemBox' as const;

  item_id: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.version === 0) {
      this.item_id = stream.readUint16();
    } else {
      this.item_id = stream.readUint32();
    }
  }
}
