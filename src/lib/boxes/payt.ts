import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class paytBox extends Box {
  payloadID?: number;
  rtpmap_string?: string;

  constructor(size?: number) {
    super('payt', size);
  }

  parse(stream: MultiBufferStream) {
    this.payloadID = stream.readUint32();
    const count = stream.readUint8();
    this.rtpmap_string = stream.readString(count);
  }
}
