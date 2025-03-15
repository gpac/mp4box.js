BoxParser.createFullBoxCtor("mfro", "MovieFragmentRandomAccessOffsetBox", function(stream) {
	this._size = stream.readUint32();
});

