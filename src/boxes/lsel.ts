import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class lselBox extends Box {
  static override fourcc = 'lsel' as const;
  box_name = 'LayerSelectorProperty' as const;

  layer_id: number;

  parse(stream: MultiBufferStream) {
    this.layer_id = stream.readUint16();
  }
}
