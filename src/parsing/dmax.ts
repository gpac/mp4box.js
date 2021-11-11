export default (BoxParser: any) => {
  BoxParser.createBoxCtor('dmax', function (this: any, stream: any) {
    this.time = stream.readUint32();
  });
};
