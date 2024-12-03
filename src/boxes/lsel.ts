import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class lselBox extends Box {
  type = 'lsel' as const;

  layer_id: number;

  parse(stream: MultiBufferStream) {
    this.layer_id = stream.readUint16();
  }
}
