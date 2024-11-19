import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class paylBox extends Box {
  text?: string;

  constructor(size?: number) {
    super('payl', size);
  }

  parse(stream: MultiBufferStream) {
    this.text = stream.readString(this.size - this.hdr_size);
  }
}
