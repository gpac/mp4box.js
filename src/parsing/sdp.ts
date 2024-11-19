import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class sdpBox extends Box {
  sdptext?: string;

  constructor(size?: number) {
    super('sdp', size);
  }

  parse(stream: MultiBufferStream) {
    this.sdptext = stream.readString(this.size - this.hdr_size);
  }
}
