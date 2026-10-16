import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class cmpCBox extends FullBox {
  static override readonly fourcc = 'cmpC' as const;
  box_name = 'CompressionConfigurationBox' as const;

  compression_type: string;
  compressed_unit_type: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.compression_type = stream.readString(4);
    this.compressed_unit_type = stream.readUint8();
  }
}
