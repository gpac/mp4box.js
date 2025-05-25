import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class paylBox extends Box {
  type = 'payl' as const;
  box_name = 'CuePayloadBox'

  text: string;

  parse(stream: MultiBufferStream) {
    this.text = stream.readString(this.size - this.hdr_size);
  }
}
