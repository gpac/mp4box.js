import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class rtpBox extends Box {
  descriptionformat: string;
  sdptext: string;

  type = 'rtp' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.descriptionformat = stream.readString(4);
    this.sdptext = stream.readString(this.size - this.hdr_size - 4);
  }
}
