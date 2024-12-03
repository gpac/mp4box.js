import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class rtpBox extends Box {
  type = 'rtp' as const;

  descriptionformat: string;
  sdptext: string;

  parse(stream: MultiBufferStream) {
    this.descriptionformat = stream.readString(4);
    this.sdptext = stream.readString(this.size - this.hdr_size - 4);
  }
}
