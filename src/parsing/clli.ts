export default (BoxParser: any) => {
  BoxParser.createBoxCtor('clli', function (this: any, stream: any) {
    this.max_content_light_level = stream.readUint16();
    this.max_pic_average_light_level = stream.readUint16();
  });
};
