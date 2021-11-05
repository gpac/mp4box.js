export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('clef', function (this: any, stream: any) {
    this.width = stream.readUint32();
    this.height = stream.readUint32();
  });
};
