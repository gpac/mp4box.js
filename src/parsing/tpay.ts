export default (BoxParser: any) => {
  BoxParser.createBoxCtor('tpay', function (this: any, stream: any) {
    this.bytessent = stream.readUint32();
  });
};
