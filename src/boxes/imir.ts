import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class imirBox extends Box {
  static override fourcc = 'imir' as const;
  box_name = 'ImageMirror' as const;

  reserved: number;
  axis: number;

  parse(stream: MultiBufferStream) {
    const tmp = stream.readUint8();
    this.reserved = tmp >> 7;
    this.axis = tmp & 1;
  }
}
