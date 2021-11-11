export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('CoLL', function (this: any, stream: any) {
    this.maxCLL = stream.readUint16();
    this.maxFALL = stream.readUint16();
  });
};
