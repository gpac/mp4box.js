export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('cprt', function (this: any, stream: any) {
    this.parseLanguage(stream);
    this.notice = stream.readCString();
  });
};
