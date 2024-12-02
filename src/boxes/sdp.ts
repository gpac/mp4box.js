import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class sdpBox extends Box {
  sdptext?: string;

  type = 'sdp' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.sdptext = stream.readString(this.size - this.hdr_size);
  }
}
