export default (BoxParser: any) => {
  BoxParser.createBoxCtor('a1op', function (this: any, stream: any) {
    this.op_index = stream.readUint8();
  });
};
