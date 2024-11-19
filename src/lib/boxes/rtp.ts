import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class rtpBox extends Box {
  descriptionformat?: string;
  sdptext?: string;

  constructor(size?: number) {
    super('rtp', size);
  }

  parse(stream: MultiBufferStream) {
    this.descriptionformat = stream.readString(4);
    this.sdptext = stream.readString(this.size - this.hdr_size - 4);
  }
}
