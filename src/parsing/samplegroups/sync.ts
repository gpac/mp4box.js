export default (BoxParser: any) => {
  BoxParser.createSampleGroupCtor('sync', function (this: any, stream: any) {
    var tmp_byte = stream.readUint8();
    this.NAL_unit_type = tmp_byte & 0x3f;
  });
};
