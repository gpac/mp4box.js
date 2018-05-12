var BoxParser = require('../box.js').BoxParser;

BoxParser.stssBox.prototype.parse = function(stream) {
	var i;
	var entry_count;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	if (this.version === 0) {
		this.sample_numbers = [];
		for(i=0; i<entry_count; i++) {
			this.sample_numbers.push(stream.readUint32());
		}
	}
}

