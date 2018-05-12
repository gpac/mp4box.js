var BoxParser = require('../box.js').BoxParser;

BoxParser.cttsBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 4+8*this.sample_counts.length;
	this.writeHeader(stream);
	stream.writeUint32(this.sample_counts.length);
	for(i=0; i<this.sample_counts.length; i++) {
		stream.writeUint32(this.sample_counts[i]);
		if (this.version === 1) {
			stream.writeInt32(this.sample_offsets[i]); /* signed */
		} else {			
			stream.writeUint32(this.sample_offsets[i]); /* unsigned */
		}
	}
}

