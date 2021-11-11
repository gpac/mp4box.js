export default (BoxParser: any) => {
  BoxParser.createBoxCtor('npck', function (this: any, stream: any) {
    this.packetssent = stream.readUint32();
  });
};
