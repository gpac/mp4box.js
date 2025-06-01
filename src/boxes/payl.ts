import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class paylBox extends Box {
  static override readonly fourcc = 'payl' as const;
  box_name = 'CuePayloadBox' as const;

  text: string;

  parse(stream: MultiBufferStream) {
    this.text = stream.readString(this.size - this.hdr_size);
  }
}
