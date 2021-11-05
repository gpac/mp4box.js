export default (BoxParser: any) => {
  BoxParser.createBoxCtor('styp', function (this: any, stream: any) {
    BoxParser.ftypBox.prototype.parse.call(this, stream);
  });
};
