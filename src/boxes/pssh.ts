import { FullBox } from '#/box';
import { parseHex16 } from '#/parser';
import type { MultiBufferStream } from '#/buffer';

export class psshBox extends FullBox {
  static override fourcc = 'pssh' as const;
  box_name = 'ProtectionSystemSpecificHeaderBox' as const;

  system_id: string;
  kid: Array<string>;

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
