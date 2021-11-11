export default (BoxParser: any) => {
  BoxParser.SingleItemTypeReferenceBoxLarge = function (
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
  BoxParser.SingleItemTypeReferenceBoxLarge.prototype = new BoxParser.Box();
  BoxParser.SingleItemTypeReferenceBoxLarge.prototype.parse = function (this: any, stream: any) {
    this.from_item_ID = stream.readUint32();
    var count = stream.readUint16();
    this.references = [];
    for (var i = 0; i < count; i++) {
      this.references[i] = stream.readUint32();
    }
  };
};
