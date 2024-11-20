import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class ispeBox extends Box {
  image_width: number;
  image_height: number;

  constructor(size?: number) {
    super('ispe', size);
  }

  parse(stream: MultiBufferStream) {
    this.image_width = stream.readUint32();
    this.image_height = stream.readUint32();
  }
}
