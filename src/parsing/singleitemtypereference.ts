export default (BoxParser: any) => {
  BoxParser.SingleItemTypeReferenceBox = function (
    this: any,
    type: any,
    size: any,
    hdr_size: any,
    start: any
  ) {
    BoxParser.Box.call(this, type, size);
    this.hdr_size = hdr_size;
    this.start = start;
  };
  BoxParser.SingleItemTypeReferenceBox.prototype = new BoxParser.Box();
  BoxParser.SingleItemTypeReferenceBox.prototype.parse = function (this: any, stream: any) {
    this.from_item_ID = stream.readUint16();
    var count = stream.readUint16();
    this.references = [];
    for (var i = 0; i < count; i++) {
      this.references[i] = stream.readUint16();
    }
  };
};
