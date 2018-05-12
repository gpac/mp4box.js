var BoxParser = require('../box.js').BoxParser;

BoxParser["sdp Box"].prototype.parse = function(stream) {
	this.sdptext = stream.readString(this.size - this.hdr_size);
}

