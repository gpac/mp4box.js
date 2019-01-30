BoxParser.createUUIDBox("d4807ef2ca3946958e5426cb9e46a79f", true, false, function(stream) {
    this.fragment_count = stream.readUint8();
    this.entries = [];

    for (var i = 0; i < this.fragment_count; i++) {
        var entry = {};
        var absolute_time = 0;
        var absolute_duration = 0;

        if (this.version === 1) {
            absolute_time = stream.readUint64();
            absolute_duration = stream.readUint64();
        } else {
            absolute_time = stream.readUint32();
            absolute_duration = stream.readUint32();
        }

        entry.absolute_time = absolute_time;
        entry.absolute_duration = absolute_duration;

        this.entries.push(entry);
    }
});