export default (BoxParser: any) => {
  BoxParser.createBoxCtor('totl', function (this: any, stream: any) {
    this.bytessent = stream.readUint32();
  });
};
