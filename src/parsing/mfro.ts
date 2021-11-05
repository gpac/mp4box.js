export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('mfro', function (this: any, stream: any) {
    this._size = stream.readUint32();
  });
};
