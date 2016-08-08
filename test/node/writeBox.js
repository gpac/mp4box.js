var fs = require('fs');
var MP4BoxExports = require('../../dist/mp4box.all.js');

if (process.argv.length < 3) {
	console.log("usage: node writeBox.js <inputfilename> <outputfilename>");
	return;
}

var outfile = fs.createWriteStream(process.argv[3]);

var mp4box = new MP4BoxExports.MP4Box();

var boxDesc = fs.readFileSync(process.argv[2]);
var box = JSON.parse(boxDesc);
box.writeHeader = MP4BoxExports.BoxParser[box.type+"Box"].prototype.writeHeader;
box.write = MP4BoxExports.BoxParser[box.type+"Box"].prototype.write;
mp4box.inputIsoFile.boxes.push(box);
outfile.write(toBuffer(mp4box.writeFile()));

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