import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class totlBox extends Box {
  bytessent: number;

  constructor(size?: number) {
    super('totl', size);
  }

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint32();
  }
}
