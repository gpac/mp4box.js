import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class vttCBox extends Box {
  text: string;

  constructor(size?: number) {
    super('vttC', size);
  }

  parse(stream: MultiBufferStream) {
    this.text = stream.readString(this.size - this.hdr_size);
  }
}
