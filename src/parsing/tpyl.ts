export default (BoxParser: any) => {
  BoxParser.createBoxCtor('tpyl', function (this: any, stream: any) {
    this.bytessent = stream.readUint64();
  });
};
