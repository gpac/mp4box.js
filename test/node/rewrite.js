if (typeof exports !== 'undefined') {
	exports = rewrite;	
}

var fs = require('fs');
var MP4Box = require('mp4box');

function rewrite(infile, outfilename) {
	var outfile = fs.createWriteStream(outfilename);

	var mp4boxfile = MP4Box.createFile();

	mp4boxfile.onReady = function (info) {
	}

	var filePos = 0;
	var filereader = fs.createReadStream(infile);
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
			outfile.write(toBuffer(mp4boxfile.getBuffer()));
		}
	});	
}


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

if (process.argv.length < 3) {
	console.log("usage: node rewrite.js <inputfilename> <outputfilename>");
	return;
} else {
	rewrite(process.argv[2], process.argv[3]);
}

