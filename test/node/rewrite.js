if (typeof exports !== 'undefined') {
	exports = rewrite;	
}

var fs = require('fs');
var MP4Box = require('../../dist/mp4box.all.js').MP4Box;

function rewrite(infile, outfile) {
	var outfile = fs.createWriteStream(outfile);

	var mp4box = new MP4Box();

	mp4box.onReady = function (info) {
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
			mp4box.appendBuffer(arrayBuffer);
		} else {
			mp4box.flush();		
			outfile.write(toBuffer(mp4box.writeFile()));
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

