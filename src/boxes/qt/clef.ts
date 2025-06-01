import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class clefBox extends FullBox {
  static override readonly fourcc = 'clef' as const;
  box_name = 'TrackCleanApertureDimensionsBox' as const;

  width: number;
  height: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.width = stream.readUint32();
    this.height = stream.readUint32();
  }
}
