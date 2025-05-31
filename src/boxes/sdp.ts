import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class sdp_Box extends Box {
  static fourcc = 'sdp ' as const;
  box_name = 'rtptracksdphintinformation' as const;

  sdptext?: string;

  parse(stream: MultiBufferStream) {
    this.sdptext = stream.readString(this.size - this.hdr_size);
  }
}
