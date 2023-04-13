BoxParser.createBoxCtor("cdef", function(stream) {
    var i;
    this.channel_count = stream.readUint16();
    this.channel_indexes = [];
    this.channel_types = [];
    this.channel_associations = [];
    for (i = 0; i < this.channel_count; i++) {
        this.channel_indexes.push(stream.readUint16());
        this.channel_types.push(stream.readUint16());
        this.channel_associations.push(stream.readUint16());
    }
});

