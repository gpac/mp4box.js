export default (BoxParser: any) => {
  BoxParser.createBoxCtor('imir', function (this: any, stream: any) {
    var tmp = stream.readUint8();
    this.reserved = tmp >> 7;
    this.axis = tmp & 1;
  });
};
