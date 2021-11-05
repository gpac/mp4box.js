export default (BoxParser: any) => {
  BoxParser.createBoxCtor('sdp ', function (this: any, stream: any) {
    this.sdptext = stream.readString(this.size - this.hdr_size);
  });
};
