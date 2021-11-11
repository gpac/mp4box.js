export default (BoxParser: any) => {
  BoxParser.createBoxCtor('rtp ', function (this: any, stream: any) {
    this.descriptionformat = stream.readString(4);
    this.sdptext = stream.readString(this.size - this.hdr_size - 4);
  });
};
