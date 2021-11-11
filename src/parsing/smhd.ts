export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('smhd', function (this: any, stream: any) {
    this.balance = stream.readUint16();
    stream.readUint16();
  });
};
