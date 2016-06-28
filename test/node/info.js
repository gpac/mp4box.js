var fs = require('fs');
var MP4Box = require('mp4box');

if (process.argv.length > 2) {
	var mp4boxfile = MP4Box.createFile();
	var arrayBuffer = new Uint8Array(fs.readFileSync(process.argv[2])).buffer;
	arrayBuffer.fileStart = 0;

	mp4boxfile.appendBuffer(arrayBuffer);
	console.log(mp4boxfile.getInfo());
} else {
	console.log("usage: node info.js <file>");
}
