import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class paytBox extends Box {
  static override readonly fourcc = 'payt' as const;
  box_name = 'hintpayloadID' as const;

  payloadID: number;
  rtpmap_string: string;

  parse(stream: MultiBufferStream) {
    this.payloadID = stream.readUint32();
    const count = stream.readUint8();
    this.rtpmap_string = stream.readString(count);
  }
}
