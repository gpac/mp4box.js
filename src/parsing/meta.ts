export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('meta', function (this: any, stream: any) {
    this.boxes = [];
    BoxParser.ContainerBox.prototype.parse.call(this, stream);
  });
};
