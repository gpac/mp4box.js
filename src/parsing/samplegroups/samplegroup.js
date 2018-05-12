var Log = require("../../log.js").Log;
var BoxParser = require('../../box.js').BoxParser;

BoxParser.SampleGroupEntry.prototype.parse = function(stream) {
	Log.warn("BoxParser", "Unknown Sample Group type: "+this.grouping_type);
	this.data =  stream.readUint8Array(this.description_length);
}

