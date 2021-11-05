export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('trep', function (this: any, stream: any) {
    this.track_ID = stream.readUint32();
    this.boxes = [];
    while (stream.getPosition() < this.start + this.size) {
      const ret: any = BoxParser.parseOnebox(
        stream,
        false,
        this.size - (stream.getPosition() - this.start)
      );
      if (ret.code === BoxParser.OK) {
        const box: any = ret.box;
        this.boxes.push(box);
      } else {
        return;
      }
    }
  });
};
