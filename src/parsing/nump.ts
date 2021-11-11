export default (BoxParser: any) => {
  BoxParser.createBoxCtor('nump', function (this: any, stream: any) {
    this.packetssent = stream.readUint64();
  });
};
