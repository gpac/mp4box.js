export default (BoxParser: any) => {
  BoxParser.createBoxCtor('fiel', function (this: any, stream: any) {
    this.fieldCount = stream.readUint8();
    this.fieldOrdering = stream.readUint8();
  });
};
