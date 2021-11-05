export default (BoxParser: any) => {
  BoxParser.createBoxCtor('payt', function (this: any, stream: any) {
    this.payloadID = stream.readUint32();
    var count = stream.readUint8();
    this.rtpmap_string = stream.readString(count);
  });
};
