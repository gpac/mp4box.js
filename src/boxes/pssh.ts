import { FullBox, parseHex16 } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class psshBox extends FullBox {
  system_id: string;
  kid: Array<string>;

  type = 'pssh' as const;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.system_id = parseHex16(stream);
    if (this.version > 0) {
      const count = stream.readUint32();
      this.kid = [];
      for (let i = 0; i < count; i++) {
        this.kid[i] = parseHex16(stream);
      }
    }
    const datasize = stream.readUint32();
    if (datasize > 0) {
      this.data = stream.readUint8Array(datasize);
    }
  }
}
