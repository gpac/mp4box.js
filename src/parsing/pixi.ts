export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('pixi', function (this: any, stream: any) {
    var i;
    this.num_channels = stream.readUint8();
    this.bits_per_channels = [];
    for (i = 0; i < this.num_channels; i++) {
      this.bits_per_channels[i] = stream.readUint8();
    }
  });
};
