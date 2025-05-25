import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class enofBox extends FullBox {
  type = 'enof' as const;
  box_name = 'TrackEncodedPixelsDimensionsBox';

  width: number;
  height: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.width = stream.readUint32();
    this.height = stream.readUint32();
  }
}
