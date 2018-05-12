var BoxParser = require('../../box.js').BoxParser;

BoxParser.avllSampleGroupEntry.prototype.parse = function(stream) {
	this.layerNumber = stream.readUint8();
	this.accurateStatisticsFlag = stream.readUint8();
	this.avgBitRate = stream.readUint16();
	this.avgFrameRate = stream.readUint16();
}

