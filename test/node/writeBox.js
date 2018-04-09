var fs = require('fs');
var MP4Box = require('mp4box');

if (process.argv.length < 3) {
	console.log("usage: node writeBox.js <inputfilename> <outputfilename>");
	return;
}

var outfile = fs.createWriteStream(process.argv[3]);

var mp4boxfile = MP4Box.createFile();

var boxDesc = fs.readFileSync(process.argv[2]);
var box = JSON.parse(boxDesc);
box.writeHeader = MP4Box.BoxParser[box.type+"Box"].prototype.writeHeader;
box.write = MP4Box.BoxParser[box.type+"Box"].prototype.write;
mp4boxfile.boxes.push(box);
outfile.write(toBuffer(mp4boxfile.getBuffer()));

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