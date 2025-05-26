import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { DataStream } from '#/DataStream';
import type { ES_Descriptor } from '#/descriptor';
import type { MP4BoxBuffer } from '#/mp4boxbuffer';
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
      const arrayBuffer = new ArrayBuffer(esd_data.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      uint8Array.set(esd_data);

      const mp4Buffer: MP4BoxBuffer = Object.assign(arrayBuffer, { fileStart: 0 });
      const mp4Dataview = new DataView(mp4Buffer, 0, arrayBuffer.byteLength);

      this.esd = esd_parser.parseOneDescriptor(
        new DataStream(mp4Dataview, 0, DataStream.BIG_ENDIAN),
      ) as ES_Descriptor;
    }
  }
}
