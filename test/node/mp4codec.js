var fs = require('fs');
var mp4boxModule = require('mp4box');

if (process.argv.length < 3) {
	console.log("usage: node mp4codec.js <inputfilename>");
	return;
}

var mp4box = new mp4boxModule.MP4Box();
var stopParse = false;

mp4box.onReady = function (info) {
	var mime = 'video/mp4; codecs=\"';
	for (var i = 0; i < info.tracks.length; i++) {
		if (i !== 0) mime += ',';
		mime+= info.tracks[i].codec;
	}
	mime += '\"';
	console.log(mime);
	stopParse = true;
}

var filePos = 0;
var filereader = fs.createReadStream(process.argv[2]);
filereader.on('readable', function () {
	if (stopParse) {
	} else {
		//console.log("Readable event");
		var chunk = filereader.read();
		//console.log("Read chunk", chunk);
		if (chunk) {
			var arrayBuffer = toArrayBuffer(chunk);
			//console.log("ArrayBuffer", arrayBuffer);
			arrayBuffer.fileStart = filePos;
			filePos += arrayBuffer.byteLength;
			mp4box.appendBuffer(arrayBuffer);
		} else {
			mp4box.flush();
		}
	}
});


function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return ab;
}
