// FIXME Does this function already exist in MP4Box?
function toByteArray(hexString) {
	var result = [];
	while (hexString.length >= 2) {
		result.push(parseInt(hexString.substring(0, 2), 16));
		hexString = hexString.substring(2, hexString.length);
	}
	return new Uint8Array(result);
}

BoxParser.psshBox.prototype.write = function(stream) {
	// Add the system id byte length.
	var byteArray = toByteArray(this.system_id);

	// Calculate the full box size.
	this.size = this.hdr_size + this.data.byteLength + byteArray.byteLength + 4;

	// Write out the BMFF box header.
	stream.writeInt32(this.size);
	stream.writeString(this.type, null, 4);

	// Write out the full box header.
	stream.writeUint8(this.version);
	stream.writeUint24(this.flags);

	// Write out the pssh data.
	stream.writeUint8Array(byteArray);
	stream.writeUint32(this.data.byteLength);
	stream.writeUint8Array(this.data);
}
