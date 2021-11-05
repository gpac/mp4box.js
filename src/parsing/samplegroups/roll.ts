export default (BoxParser: any) => {
  BoxParser.createSampleGroupCtor('roll', function (this: any, stream: any) {
    this.roll_distance = stream.readInt16();
  });
};
