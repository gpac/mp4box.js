import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { DataStream } from '#/DataStream';
import type { ES_Descriptor } from '#/descriptor';
import { DescriptorRegistry } from '#/registry';

export class esdsBox extends FullBox {
  static override readonly fourcc = 'esds' as const;
  box_name = 'ElementaryStreamDescriptorBox' as const;

  esd: ES_Descriptor;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    const esd_data = stream.readUint8Array(this.size - this.hdr_size);
    // NOTE:    This used to be `typeof MPEG4DescriptorParser !== 'undefined'`
    if ('MPEG4DescriptorParser' in DescriptorRegistry) {
      const esd_parser = new DescriptorRegistry.MPEG4DescriptorParser();
      this.esd = esd_parser.parseOneDescriptor(new DataStream(esd_data.buffer, 0)) as ES_Descriptor;
    }
  }
}
