export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('vmhd', function (this: any, stream: any) {
    this.graphicsmode = stream.readUint16();
    this.opcolor = stream.readUint16Array(3);
  });
};
