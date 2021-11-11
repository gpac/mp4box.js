export default (BoxParser: any) => {
  BoxParser.createBoxCtor('pmax', function (this: any, stream: any) {
    this.bytes = stream.readUint32();
  });
};
