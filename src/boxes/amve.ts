import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import type { BitStream } from '#/bitstream';

export class amveBox extends Box {
  static override readonly fourcc = 'amve' as const;
  box_name = 'AmbientViewingEnvironmentBox' as const;

  ambient_illuminance: number;
  ambient_light_x: number;
  ambient_light_y: number;

  parse(stream: MultiBufferStream | BitStream) {
    this.ambient_illuminance = stream.readUint32();
    this.ambient_light_x = stream.readUint16();
    this.ambient_light_y = stream.readUint16();
  }
}
