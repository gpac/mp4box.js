import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { DataStream } from '#/DataStream';
import type { ES_Descriptor } from '#/descriptor';
import { DescriptorRegistry } from '#/registry';

export class esdsBox extends FullBox {
  esd: ES_Descriptor;

  type = 'esds' as const;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    let esd_data = stream.readUint8Array(this.size - this.hdr_size);
    // NOTE:    This used to be `typeof MPEG4DescriptorParser !== 'undefined'`
    if ('MPEG4DescriptorParser' in DescriptorRegistry) {
      let esd_parser = new DescriptorRegistry.MPEG4DescriptorParser();
      this.esd = esd_parser.parseOneDescriptor(
        new DataStream(esd_data.buffer, 0, DataStream.BIG_ENDIAN),
      ) as ES_Descriptor;
    }
  }
}
