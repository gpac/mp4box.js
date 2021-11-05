export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('enof', function (this: any, stream: any) {
    this.width = stream.readUint32();
    this.height = stream.readUint32();
  });
};
