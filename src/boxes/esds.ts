import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { DataStream, Endianness } from '#/DataStream';
import type { ES_Descriptor } from '#/descriptor';
import { DescriptorRegistry } from '#/registry';

export class esdsBox extends FullBox {
  type = 'esds' as const;
  box_name = 'ElementaryStreamDescriptorBox';

  esd: ES_Descriptor;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    const esd_data = stream.readUint8Array(this.size - this.hdr_size);
    // NOTE:    This used to be `typeof MPEG4DescriptorParser !== 'undefined'`
    if ('MPEG4DescriptorParser' in DescriptorRegistry) {
      const esd_parser = new DescriptorRegistry.MPEG4DescriptorParser();
      this.esd = esd_parser.parseOneDescriptor(
        new DataStream(esd_data.buffer, 0, Endianness.BIG_ENDIAN),
      ) as ES_Descriptor;
    }
  }
}
