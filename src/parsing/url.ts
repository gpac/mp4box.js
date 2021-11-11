export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('url ', function (this: any, stream: any) {
    if (this.flags !== 0x000001) {
      this.location = stream.readCString();
    }
  });
};
