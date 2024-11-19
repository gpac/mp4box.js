import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class clefBox extends FullBox {
  width?: number;
  height?: number;

  constructor(size?: number) {
    super('clef', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.width = stream.readUint32();
    this.height = stream.readUint32();
  }
}
