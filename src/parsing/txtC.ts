export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('txtC', function (this: any, stream: any) {
    this.config = stream.readCString();
  });
};
