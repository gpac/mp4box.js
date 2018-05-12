var BoxParser = require('../../box.js').BoxParser;

BoxParser.SampleGroupEntry.prototype.write = function(stream) {
	stream.writeUint8Array(this.data);
}

