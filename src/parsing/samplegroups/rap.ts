export default (BoxParser: any) => {
  BoxParser.createSampleGroupCtor('rap ', function (this: any, stream: any) {
    var tmp_byte = stream.readUint8();
    this.num_leading_samples_known = tmp_byte >> 7;
    this.num_leading_samples = tmp_byte & 0x7f;
  });
};
