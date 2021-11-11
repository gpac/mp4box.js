export default (BoxParser: any) => {
  BoxParser.createBoxCtor('drep', function (this: any, stream: any) {
    this.bytessent = stream.readUint64();
  });
};
