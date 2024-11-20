import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';
import { DataStream } from '../DataStream';
import { ES_Descriptor, MPEG4DescriptorParser } from '../descriptor';

export class esdsBox extends FullBox {
  esd: ES_Descriptor;

  constructor(size?: number) {
    super('esds', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    let esd_data = stream.readUint8Array(this.size - this.hdr_size);
    // FIXME:   This line has some specific assumptions around code-splitting.
    if (typeof MPEG4DescriptorParser !== 'undefined') {
      let esd_parser = new MPEG4DescriptorParser();
      this.esd = esd_parser.parseOneDescriptor(
        new DataStream(esd_data.buffer, 0, DataStream.BIG_ENDIAN),
      ) as ES_Descriptor;
    }
  }
}
