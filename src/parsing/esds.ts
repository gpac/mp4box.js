import { FullBox } from '../box';
import type { MultiBufferStream } from '../buffer';
import { DataStream } from '../DataStream';
import { Descriptor, MPEG4DescriptorParser } from '../descriptor';

export class esdsBox extends FullBox {
  esd?: Descriptor;

  constructor(size?: number) {
    super('esds', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    let esd_data = stream.readUint8Array(this.size - this.hdr_size);
    if (typeof MPEG4DescriptorParser !== 'undefined') {
      let esd_parser = new MPEG4DescriptorParser();
      this.esd = esd_parser.parseOneDescriptor(
        new DataStream(esd_data.buffer, 0, DataStream.BIG_ENDIAN),
      );
    }
  }
}
