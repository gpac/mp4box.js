export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('mfhd', function (this: any, stream: any) {
    this.sequence_number = stream.readUint32();
  });
};
