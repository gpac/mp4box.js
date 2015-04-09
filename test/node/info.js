
if (process.argv.length > 2) {
	var mp4box = new (require('mp4box').MP4Box)();
	var fs = require('fs');
	var arrayBuffer = new Uint8Array(fs.readFileSync(process.argv[2])).buffer;
	arrayBuffer.fileStart = 0;

	mp4box.appendBuffer(arrayBuffer);
	console.log(mp4box.getInfo());
} else {
	console.log("usage: node info.js <file>");
}
