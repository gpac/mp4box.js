export default (BoxParser: any) => {
  BoxParser.createBoxCtor('tmax', function (this: any, stream: any) {
    this.time = stream.readUint32();
  });
};
