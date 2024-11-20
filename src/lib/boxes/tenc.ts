import { FullBox, parseHex16 } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class tencBox extends FullBox {
  default_crypt_byte_block: number;
  default_skip_byte_block: number;
  default_isProtected: number;
  default_Per_Sample_IV_Size: number;
  default_KID: string;
  default_constant_IV_size: number;
  default_constant_IV: Uint8Array;

  constructor(size?: number) {
    super('tenc', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    stream.readUint8(); // reserved
    if (this.version === 0) {
      stream.readUint8();
    } else {
      const tmp = stream.readUint8();
      this.default_crypt_byte_block = (tmp >> 4) & 0xf;
      this.default_skip_byte_block = tmp & 0xf;
    }
    this.default_isProtected = stream.readUint8();
    this.default_Per_Sample_IV_Size = stream.readUint8();
    this.default_KID = parseHex16(stream);
    if (this.default_isProtected === 1 && this.default_Per_Sample_IV_Size === 0) {
      this.default_constant_IV_size = stream.readUint8();
      this.default_constant_IV = stream.readUint8Array(this.default_constant_IV_size);
    }
  }
}
