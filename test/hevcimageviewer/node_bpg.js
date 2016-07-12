var fs = require('fs');
var HEVCFrame = require('./hevcframe.js');
var NALUFrame = require('./naluframe.js');
var BPG = require('./bpg.js');

function toBuffer(ab) {
    var buffer = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
    }
    return buffer;
}
if (process.argv.length < 3) {
	console.log("Missing argument");
	return;
}

var arrayBuffer = new Uint8Array(fs.readFileSync(process.argv[2])).buffer;
var bpg = new BPG();
bpg.read(arrayBuffer);
var frame = new HEVCFrame();
frame.SPS = bpg.getHEVCSPS();

var outfilename = 'out.hevc';
if (process.argv.length >=4) {
	outfilename = process.argv[3]+'.hevc';
} else {
	outfilename = process.argv[2].replace('.bpg','_bpg.hevc');
}
console.log("Generating "+outfilename);

var vpsbuffer = frame.writeVPS();
fs.writeFileSync(outfilename, toBuffer(vpsbuffer));
var spsbuffer = frame.writeSPS();
fs.appendFileSync(outfilename, toBuffer(spsbuffer));

for (var i = 0; i < bpg.frames.length; i++) {
	var bpgframe = bpg.frames[i];
	for (var j = 0; j < bpgframe.length; j++) {
		var u8nalu = new Uint8Array(bpgframe[j]);
		u8nalu = NALUFrame.addEmulationBytes(u8nalu);
		u8nalu = NALUFrame.addStartCode(u8nalu);
		fs.appendFileSync(outfilename, toBuffer(u8nalu.buffer));
	}
}
