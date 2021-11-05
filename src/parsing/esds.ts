import { DataStream } from '../../src/DataStream';
import { MPEG4DescriptorParser } from '../../src/descriptor';

export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('esds', function (this: any, stream: any) {
    var esd_data = stream.readUint8Array(this.size - this.hdr_size);
    if (typeof MPEG4DescriptorParser !== 'undefined') {
      var esd_parser = new MPEG4DescriptorParser();
      this.esd = esd_parser.parseOneDescriptor(
        new DataStream(esd_data.buffer, 0, DataStream.BIG_ENDIAN)
      );
    }
  });
};
