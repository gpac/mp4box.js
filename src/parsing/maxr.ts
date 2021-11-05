export default (BoxParser: any) => {
  BoxParser.createBoxCtor('maxr', function (this: any, stream: any) {
    this.period = stream.readUint32();
    this.bytes = stream.readUint32();
  });
};
