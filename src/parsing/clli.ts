import { Box } from '../box';
import type { MultiBufferStream } from '../buffer';

export class clliBox extends Box {
  max_content_light_level?: number;
  max_pic_average_light_level?: number;

  constructor(size?: number) {
    super('clli', size);
  }

  parse(stream: MultiBufferStream) {
    this.max_content_light_level = stream.readUint16();
    this.max_pic_average_light_level = stream.readUint16();
  }
}
