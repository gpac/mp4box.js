var fs = require('fs');
var mp4boxModule = require('mp4box');

if (process.argv.length > 2) {
	var mp4box = new mp4boxModule.MP4Box();
	var arrayBuffer = new Uint8Array(fs.readFileSync(process.argv[2])).buffer;
	arrayBuffer.fileStart = 0;

	mp4box.appendBuffer(arrayBuffer);
	console.log(mp4box.getInfo());
} else {
	console.log("usage: node info.js <file>");
}
