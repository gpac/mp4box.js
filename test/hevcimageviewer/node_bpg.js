var fs = require('fs');
var HEVCFrame = require('./hevcframe.js').HEVCFrame;
var BitStream = require('./bitstream.js').BitStream;
var BPG = require('./bpg.js').BPG;

function toBuffer(ab) {
    var buffer = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
    }
    return buffer;
}

var arrayBuffer = new Uint8Array(fs.readFileSync(process.argv[2])).buffer;
var bitStreamRead = new BitStream(arrayBuffer);
var bpg = new BPG(bitStreamRead);
var frame = new HEVCFrame();
frame.SPS = bpg.header;
var cb_size = 1 << (bpg.header.log2_min_luma_coding_block_size_minus3+3);
frame.SPS.pic_width_in_luma_samples = Math.ceil(bpg.picture_width/cb_size) * cb_size;
frame.SPS.pic_height_in_luma_samples = Math.ceil(bpg.picture_height/cb_size) * cb_size;
frame.SPS.chroma_format_idc = bpg.pixel_format;
frame.SPS.bit_depth_luma_minus8 = bpg.bit_depth_minus_8;
frame.SPS.bit_depth_chroma_minus8 = bpg.bit_depth_minus_8;
frame.SPS.max_transform_hierarchy_depth_inter = frame.SPS.max_transform_hierarchy_depth_intra;

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
/*var u8nalus = new Uint8Array(bpg.hevc_data_byte);
fs.appendFileSync('out.hevc', toBuffer(u8nalus.buffer));*/

for (var i = 0; i < bpg.frames.length; i++) {
	var f = bpg.frames[i];
	for (var j = 0; j < f.length; j++) {
		var n = f[j];
		var u8nalu = new Uint8Array(n);
		u8nalu = HEVCFrame.prototype.addEmulationBytes(u8nalu);
		u8nalu = HEVCFrame.prototype.addStartCode(u8nalu);
		fs.appendFileSync(outfilename, toBuffer(u8nalu.buffer));
	}
}
