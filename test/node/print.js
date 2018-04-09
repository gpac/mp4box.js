var fs = require('fs');
var MP4Box = require('../../dist/mp4box.all.js');

if (process.argv.length > 2) {
	if (fs.existsSync(process.argv[2])) {
		var mp4boxfile = MP4Box.createFile();
		var arrayBuffer = new Uint8Array(fs.readFileSync(process.argv[2])).buffer;
		arrayBuffer.fileStart = 0;

		mp4boxfile.appendBuffer(arrayBuffer);
		mp4boxfile.print(console);
	} else {
		console.log("File "+process.argv[2]+ " does not exist.");
	}
} else {
	console.log("usage: node print.js <file>");
}
