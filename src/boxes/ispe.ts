import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class ispeBox extends Box {
  type = 'ispe' as const;

  image_width: number;
  image_height: number;

  parse(stream: MultiBufferStream) {
    this.image_width = stream.readUint32();
    this.image_height = stream.readUint32();
  }
}
