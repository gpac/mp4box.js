BoxParser.drefBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4; //
	this.writeHeader(stream);
	stream.writeUint32(this.entries.length);
	for (var i = 0; i < this.entries.length; i++) {
		this.entries[i].write(stream);
		this.size += this.entries[i].size;
	}	
	/* adjusting the size, now that all sub-boxes are known */
	Log.debug("BoxWriter", "Adjusting box "+this.type+" with new size "+this.size);
	stream.adjustUint32(this.sizePosition, this.size);
}

