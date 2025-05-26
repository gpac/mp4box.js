import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class ftypBox extends Box {
  type = 'ftyp' as const;
  box_name = 'FileTypeBox';

  major_brand: string;
  minor_version: number;
  compatible_brands: string[];

  parse(stream: MultiBufferStream) {
    let toparse = this.size - this.hdr_size;
    this.major_brand = stream.readString(4);
    this.minor_version = stream.readUint32();
    toparse -= 8;
    this.compatible_brands = [];
    let i = 0;
    while (toparse >= 4) {
      this.compatible_brands[i] = stream.readString(4);
      toparse -= 4;
      i++;
    }
  }

  /** @bundle writing/ftyp.js */
  write(stream: MultiBufferStream) {
    this.size = 8 + 4 * this.compatible_brands.length;
    this.writeHeader(stream);
    stream.writeString(this.major_brand, null, 4);
    stream.writeUint32(this.minor_version);
    for (let i = 0; i < this.compatible_brands.length; i++) {
      stream.writeString(this.compatible_brands[i], null, 4);
    }
  }
}
