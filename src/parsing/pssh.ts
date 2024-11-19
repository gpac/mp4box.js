import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';
import { parseHex16 } from '../box-parse';

export class psshBox extends FullBox {
  system_id?: unknown;
  kid?: string[];

  constructor(size?: number) {
    super('pssh', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.system_id = parseHex16(stream);
    if (this.version > 0) {
      var count = stream.readUint32();
      this.kid = [];
      for (var i = 0; i < count; i++) {
        this.kid[i] = parseHex16(stream);
      }
    }
    var datasize = stream.readUint32();
    if (datasize > 0) {
      this.data = stream.readUint8Array(datasize);
    }
  }
}
