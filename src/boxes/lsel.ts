import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class lselBox extends Box {
  layer_id: number;

  type = 'lsel' as const;

  parse(stream: MultiBufferStream) {
    this.layer_id = stream.readUint16();
  }
}
