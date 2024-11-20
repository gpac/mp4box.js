import { SampleGroupEntry, parseHex16 } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class seigSampleGroupEntry extends SampleGroupEntry {
  reserved: number;
  crypt_byte_block: number;
  skip_byte_block: number;
  isProtected: number;
  Per_Sample_IV_Size: number;
  KID: unknown;
  constant_IV_size: number;
  constant_IV: number | Uint8Array;

  parse(stream: MultiBufferStream) {
    this.reserved = stream.readUint8();
    const tmp = stream.readUint8();
    this.crypt_byte_block = tmp >> 4;
    this.skip_byte_block = tmp & 0xf;
    this.isProtected = stream.readUint8();
    this.Per_Sample_IV_Size = stream.readUint8();
    this.KID = parseHex16(stream);
    this.constant_IV_size = 0;
    this.constant_IV = 0;
    if (this.isProtected === 1 && this.Per_Sample_IV_Size === 0) {
      this.constant_IV_size = stream.readUint8();
      this.constant_IV = stream.readUint8Array(this.constant_IV_size);
    }
  }
}
