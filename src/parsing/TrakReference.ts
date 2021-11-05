export default (BoxParser: any) => {
  BoxParser.TrackReferenceTypeBox = function (
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
  BoxParser.TrackReferenceTypeBox.prototype = new BoxParser.Box();
  BoxParser.TrackReferenceTypeBox.prototype.parse = function (this: any, stream: any) {
    this.track_ids = stream.readUint32Array((this.size - this.hdr_size) / 4);
  };
};
