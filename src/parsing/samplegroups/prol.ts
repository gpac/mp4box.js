export default (BoxParser: any) => {
  BoxParser.createSampleGroupCtor('prol', function (this: any, stream: any) {
    this.roll_distance = stream.readInt16();
  });
};
