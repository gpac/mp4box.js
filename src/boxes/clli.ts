import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import type { BitStream } from '#/bitstream';

export class clliBox extends Box {
  static override readonly fourcc = 'clli' as const;
  box_name = 'ContentLightLevelBox' as const;

  max_content_light_level: number;
  max_pic_average_light_level: number;

  parse(stream: MultiBufferStream | BitStream) {
    this.max_content_light_level = stream.readUint16();
    this.max_pic_average_light_level = stream.readUint16();
  }
}
