BoxParser.createUUIDBox("6d1d9b0542d544e680e2141daff757b2", true, false, function(stream) {
    if (this.version === 1) {
       this.absolute_time = stream.readUint64();
       this.duration = stream.readUint64();
    } else {
       this.absolute_time = stream.readUint32();
       this.duration = stream.readUint32();
    }
});