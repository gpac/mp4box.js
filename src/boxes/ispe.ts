import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class ispeBox extends FullBox {
  type = 'ispe' as const;
  box_name = 'ImageSpatialExtentsProperty'

  image_width: number;
  image_height: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.image_width = stream.readUint32();
    this.image_height = stream.readUint32();
  }
}
