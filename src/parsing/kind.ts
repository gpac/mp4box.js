export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('kind', function (this: any, stream: any) {
    this.schemeURI = stream.readCString();
    this.value = stream.readCString();
  });
};
