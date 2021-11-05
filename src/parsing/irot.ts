export default (BoxParser: any) => {
  BoxParser.createBoxCtor('irot', function (this: any, stream: any) {
    this.angle = stream.readUint8() & 0x3;
  });
};
