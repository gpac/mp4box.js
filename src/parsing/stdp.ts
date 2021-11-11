export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('stdp', function (this: any, stream: any) {
    var count = (this.size - this.hdr_size) / 2;
    this.priority = [];
    for (var i = 0; i < count; i++) {
      this.priority[i] = stream.readUint16();
    }
  });
};
