import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class padbBox extends FullBox {
  padbits?: number | number[];

  constructor(size?: number) {
    super('padb', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    var sample_count = stream.readUint32();
    this.padbits = [];
    for (var i = 0; i < Math.floor((sample_count + 1) / 2); i++) {
      // TODO: is this a bug?
      this.padbits = stream.readUint8();
    }
  }
}