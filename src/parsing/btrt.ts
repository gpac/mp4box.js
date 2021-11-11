export default (BoxParser: any) => {
  BoxParser.createBoxCtor('btrt', function (this: any, stream: any) {
    this.bufferSizeDB = stream.readUint32();
    this.maxBitrate = stream.readUint32();
    this.avgBitrate = stream.readUint32();
  });
};
