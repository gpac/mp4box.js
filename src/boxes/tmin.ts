import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class tminBox extends Box {
  static fourcc = 'tmin' as const;
  box_name = 'hintminrelativetime' as const;

  time: number;

  parse(stream: MultiBufferStream) {
    this.time = stream.readUint32();
  }
}
