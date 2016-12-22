BoxParser.paspBox.prototype.parse = function(stream) {
	this.hSpacing = stream.readUint32();
	this.vSpacing = stream.readUint32();
}