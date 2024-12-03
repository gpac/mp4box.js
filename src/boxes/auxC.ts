import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class auxCBox extends FullBox {
  type = 'auxC' as const;

  aux_type: string;
  aux_subtype: Uint8Array;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.aux_type = stream.readCString();
    const aux_subtype_length = this.size - this.hdr_size - (this.aux_type.length + 1);
    this.aux_subtype = stream.readUint8Array(aux_subtype_length);
  }
}
