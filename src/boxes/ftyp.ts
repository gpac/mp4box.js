import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import type { DataStream } from '#/DataStream';

export class ftypBox extends Box {
  static override readonly fourcc = 'ftyp' as const;
  box_name = 'FileTypeBox' as const;

  major_brand: string;
  minor_version: number | string;
  compatible_brands: Array<string>;

  parse(stream: MultiBufferStream) {
    let toparse = this.size - this.hdr_size;
    this.major_brand = stream.readString(4);
    this.minor_version = stream.readUint32();
    const minor_version_str = String.fromCharCode(
      this.minor_version >> 24,
      (this.minor_version >> 16) & 255,
      (this.minor_version >> 8) & 255,
      this.minor_version & 255,
    );
    if (minor_version_str.match('[a-zA-Z0-9][a-zA-Z0-9][a-zA-Z0-9][a-zA-Z0-9]')) {
      // This seems like a four-character code. Display it as such.
      this.minor_version = minor_version_str;
    }
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
  write(stream: MultiBufferStream | DataStream) {
    this.size = 8 + 4 * this.compatible_brands.length;
    this.writeHeader(stream);
    stream.writeString(this.major_brand, undefined, 4);
    if (typeof this.minor_version === 'number') {
      stream.writeUint32(this.minor_version);
    } else {
      stream.writeString(this.minor_version, undefined, 4);
    }
    for (let i = 0; i < this.compatible_brands.length; i++) {
      stream.writeString(this.compatible_brands[i], undefined, 4);
    }
  }
}
