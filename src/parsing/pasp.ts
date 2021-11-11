export default (BoxParser: any) => {
  BoxParser.createBoxCtor('pasp', function (this: any, stream: any) {
    this.hSpacing = stream.readUint32();
    this.vSpacing = stream.readUint32();
  });
};
