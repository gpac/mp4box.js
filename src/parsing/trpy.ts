export default (BoxParser: any) => {
  BoxParser.createBoxCtor('trpy', function (this: any, stream: any) {
    this.bytessent = stream.readUint64();
  });
};
