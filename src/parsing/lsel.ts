export default (BoxParser: any) => {
  BoxParser.createBoxCtor('lsel', function (this: any, stream: any) {
    this.layer_id = stream.readUint16();
  });
};
