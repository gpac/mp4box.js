export default (BoxParser: any) => {
  BoxParser.TrackGroupTypeBox.prototype.parse = function (this: any, stream: any) {
    this.parseFullHeader(stream);
    this.track_group_id = stream.readUint32();
  };
};
