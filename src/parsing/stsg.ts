export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('stsg', function (this: any, stream: any) {
    this.grouping_type = stream.readUint32();
    var count = stream.readUint16();
    this.group_description_index = [];
    for (var i = 0; i < count; i++) {
      this.group_description_index[i] = stream.readUint32();
    }
  });
};
