export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('trex', function (this: any, stream: any) {
    this.track_id = stream.readUint32();
    this.default_sample_description_index = stream.readUint32();
    this.default_sample_duration = stream.readUint32();
    this.default_sample_size = stream.readUint32();
    this.default_sample_flags = stream.readUint32();
  });
};
