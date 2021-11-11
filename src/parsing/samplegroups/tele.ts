export default (BoxParser: any) => {
  BoxParser.createSampleGroupCtor('tele', function (this: any, stream: any) {
    var tmp_byte = stream.readUint8();
    this.level_independently_decodable = tmp_byte >> 7;
  });
};
