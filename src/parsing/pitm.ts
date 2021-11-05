export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('pitm', function (this: any, stream: any) {
    if (this.version === 0) {
      this.item_id = stream.readUint16();
    } else {
      this.item_id = stream.readUint32();
    }
  });
};
