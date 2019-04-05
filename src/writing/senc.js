BoxParser.sencBox.prototype.write = function(stream) {
	// Calculate the full box size.
	this.size = this.hdr_size + this.data.byteLength;

	// Write out the BMFF box header.
	stream.writeInt32(this.size);
	stream.writeString(this.type, null, 4);

	// Write out the full box header.
	stream.writeUint8(this.version);
	stream.writeUint24(this.flags);

	// Write out the senc data.
	stream.writeUint32(this.data.byteLength);
	stream.writeUint8Array(this.data);
}
