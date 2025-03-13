BoxParser.createBoxCtor("payt", "hintpayloadID", function(stream) {
	this.payloadID = stream.readUint32();
	var count = stream.readUint8();
	this.rtpmap_string = stream.readString(count);
});

