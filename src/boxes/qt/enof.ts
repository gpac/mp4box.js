import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class enofBox extends FullBox {
  static fourcc = 'enof' as const;
  box_name = 'TrackEncodedPixelsDimensionsBox' as const;

  width: number;
  height: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.width = stream.readUint32();
    this.height = stream.readUint32();
  }
}
