export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('ispe', function (this: any, stream: any) {
    this.image_width = stream.readUint32();
    this.image_height = stream.readUint32();
  });
};
