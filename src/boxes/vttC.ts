import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class vttCBox extends Box {
  static override readonly fourcc = 'vttC' as const;
  box_name = 'WebVTTConfigurationBox' as const;

  text: string;

  parse(stream: MultiBufferStream) {
    this.text = stream.readString(this.size - this.hdr_size);
  }
}
