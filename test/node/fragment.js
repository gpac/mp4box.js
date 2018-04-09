var fs = require('fs');
var MP4Box = require('mp4box');

if (process.argv.length < 5) {
	console.log("usage: node fragment.js <inputfilename> <trackid> <nbSamplesPerSeg> <outputfilename>");
	return;
}

var out = fs.createWriteStream(process.argv[5]);

var mp4boxfile = MP4Box.createFile();

mp4boxfile.onReady = function (info) {
	var found = false;
	var segOptions = { nbSamples: +process.argv[4] };
	console.log("Movie information received");
	for (var i = 0; i < info.tracks.length; i++) {
		if (info.tracks[i].id != process.argv[3]) continue;
		console.log("Segmenting track "+info.tracks[i].id+" with "+segOptions.nbSamples+" per segment");
		mp4boxfile.setSegmentOptions(info.tracks[i].id, null, segOptions);
		found = true;
	}
	if (found) {
		var segs = mp4boxfile.initializeSegmentation();
		out.write(toBuffer(segs[0].buffer));
		mp4boxfile.seek(0, true);
		mp4boxfile.start();
	} else {
		console.log("Track "+process.argv[3]+" not found!")
		process.exit(1);
	}
}

mp4boxfile.onSegment = function (id, user, arrayBuffer, sampleNum) {
	console.log("New segment created for track "+id+", up to sample "+sampleNum);
	out.write(toBuffer(arrayBuffer));
}

var filePos = 0;
var filereader = fs.createReadStream(process.argv[2]);
filereader.on('readable', function () {
	//console.log("Readable event");
	var chunk = filereader.read();
	//console.log("Read chunk", chunk);
	if (chunk) {
		var arrayBuffer = toArrayBuffer(chunk);
		//console.log("ArrayBuffer", arrayBuffer);
		arrayBuffer.fileStart = filePos;
		filePos += arrayBuffer.byteLength;
		mp4boxfile.appendBuffer(arrayBuffer);
	} else {
		mp4boxfile.flush();
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

function toBuffer(ab) {
    var buffer = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
    }
    return buffer;
}