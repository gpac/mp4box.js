import { FullBox } from '#/box';

export class sencBox extends FullBox {
  static fourcc = 'senc' as const;
  box_name = 'SampleEncryptionBox' as const;

  // Cannot be fully parsed because Per_Sample_IV_Size needs to be known
  /* parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    let sample_count = stream.readUint32();
    this.samples = [];
    for (let i = 0; i < sample_count; i++) {
      let sample = {};
      // tenc.default_Per_Sample_IV_Size or seig.Per_Sample_IV_Size
      sample.InitializationVector = this.readUint8Array(Per_Sample_IV_Size*8);
      if (this.flags & 0x2) {
        sample.subsamples = [];
        subsample_count = stream.readUint16();
        for (let j = 0; j < subsample_count; j++) {
          let subsample = {};
          subsample.BytesOfClearData = stream.readUint16();
          subsample.BytesOfProtectedData = stream.readUint32();
          sample.subsamples.push(subsample);
        }
      }
      // TODO
      this.samples.push(sample);
    } 
  } */
}
