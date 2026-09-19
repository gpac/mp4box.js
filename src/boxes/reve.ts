import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import type { BitStream } from '#/bitstream';

export class reveBox extends Box {
  static override readonly fourcc = 'reve' as const;
  box_name = 'ReferenceViewingEnvironment' as const;

  surround_luminance: number;
  surround_light_x: number;
  surround_light_y: number;
  periphery_luminance: number;
  periphery_light_x: number;
  periphery_light_y: number;

  parse(stream: MultiBufferStream | BitStream) {
    this.surround_luminance = stream.readUint32();
    this.surround_light_x = stream.readUint16();
    this.surround_light_y = stream.readUint16();
    this.periphery_luminance = stream.readUint32();
    this.periphery_light_x = stream.readUint16();
    this.periphery_light_y = stream.readUint16();
  }
}
