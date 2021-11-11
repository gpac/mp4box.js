export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('prft', function (this: any, stream: any) {
    this.ref_track_id = stream.readUint32();
    this.ntp_timestamp = stream.readUint64();
    if (this.version === 0) {
      this.media_time = stream.readUint32();
    } else {
      this.media_time = stream.readUint64();
    }
  });
};
