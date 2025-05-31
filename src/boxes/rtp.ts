import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class rtp_Box extends Box {
  static fourcc = 'rtp ' as const;
  box_name = 'rtpmoviehintinformation' as const;

  descriptionformat: string;
  sdptext: string;

  parse(stream: MultiBufferStream) {
    this.descriptionformat = stream.readString(4);
    this.sdptext = stream.readString(this.size - this.hdr_size - 4);
  }
}
