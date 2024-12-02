import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class paylBox extends Box {
  text: string;

  type = 'payl' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.text = stream.readString(this.size - this.hdr_size);
  }
}
