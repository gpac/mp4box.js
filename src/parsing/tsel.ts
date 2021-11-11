export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('tsel', function (this: any, stream: any) {
    this.switch_group = stream.readUint32();
    var count = (this.size - this.hdr_size - 4) / 4;
    this.attribute_list = [];
    for (var i = 0; i < count; i++) {
      this.attribute_list[i] = stream.readUint32();
    }
  });
};
