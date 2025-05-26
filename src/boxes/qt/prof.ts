import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class profBox extends FullBox {
  type = 'prof' as const;
  box_name = 'TrackProductionApertureDimensionsBox';

  width: number;
  height: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.width = stream.readUint32();
    this.height = stream.readUint32();
  }
}
