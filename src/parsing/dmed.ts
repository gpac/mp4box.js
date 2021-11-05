export default (BoxParser: any) => {
  BoxParser.createBoxCtor('dmed', function (this: any, stream: any) {
    this.bytessent = stream.readUint64();
  });
};
