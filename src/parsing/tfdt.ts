export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('tfdt', function (this: any, stream: any) {
    if (this.version == 1) {
      this.baseMediaDecodeTime = stream.readUint64();
    } else {
      this.baseMediaDecodeTime = stream.readUint32();
    }
  });
};
