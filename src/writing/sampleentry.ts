export default (BoxParser: any) => {
  BoxParser.VisualSampleEntry.prototype.write = function (stream: any) {
    this.writeHeader(stream);
    this.size += 2 * 7 + 6 * 4 + 32;
    stream.writeUint16(0);
    stream.writeUint16(0);
    stream.writeUint32(0);
    stream.writeUint32(0);
    stream.writeUint32(0);
    stream.writeUint16(this.width);
    stream.writeUint16(this.height);
    stream.writeUint32(this.horizresolution);
    stream.writeUint32(this.vertresolution);
    stream.writeUint32(0);
    stream.writeUint16(this.frame_count);
    stream.writeUint8(Math.min(31, this.compressorname.length));
    stream.writeString(this.compressorname, null, 31);
    stream.writeUint16(this.depth);
    stream.writeInt16(-1);
    this.writeFooter(stream);
  };

  BoxParser.AudioSampleEntry.prototype.write = function (stream: any) {
    this.writeHeader(stream);
    this.size += 2 * 4 + 3 * 4;
    stream.writeUint32(0);
    stream.writeUint32(0);
    stream.writeUint16(this.channel_count);
    stream.writeUint16(this.samplesize);
    stream.writeUint16(0);
    stream.writeUint16(0);
    stream.writeUint32(this.samplerate << 16);
    this.writeFooter(stream);
  };

  BoxParser.stppSampleEntry.prototype.write = function (stream: any) {
    this.writeHeader(stream);
    this.size +=
      this.namespace.length +
      1 +
      this.schema_location.length +
      1 +
      this.auxiliary_mime_types.length +
      1;
    stream.writeCString(this.namespace);
    stream.writeCString(this.schema_location);
    stream.writeCString(this.auxiliary_mime_types);
    this.writeFooter(stream);
  };
};
