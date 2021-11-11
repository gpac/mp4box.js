export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('ssix', function (this: any, stream: any) {
    this.subsegments = [];
    var subsegment_count = stream.readUint32();
    for (var i = 0; i < subsegment_count; i++) {
      var subsegment: any = {};
      this.subsegments.push(subsegment);
      subsegment.ranges = [];
      var range_count = stream.readUint32();
      for (var j = 0; j < range_count; j++) {
        var range: any = {};
        subsegment.ranges.push(range);
        range.level = stream.readUint8();
        range.range_size = stream.readUint24();
      }
    }
  });
};
