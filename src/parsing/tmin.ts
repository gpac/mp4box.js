export default (BoxParser: any) => {
  BoxParser.createBoxCtor('tmin', function (this: any, stream: any) {
    this.time = stream.readUint32();
  });
};
