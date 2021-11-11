export default (BoxParser: any) => {
  BoxParser.createSampleGroupCtor('avll', function (this: any, stream: any) {
    this.layerNumber = stream.readUint8();
    this.accurateStatisticsFlag = stream.readUint8();
    this.avgBitRate = stream.readUint16();
    this.avgFrameRate = stream.readUint16();
  });
};
