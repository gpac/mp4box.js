var fs = require('fs');
var MP4Box = require('mp4box');

var mp4boxfile = MP4Box.createFile();

function appendSidx(filename, referenceId, timescale, ept, refs) {
	var sidxBox = new MP4Box.BoxParser.sidxBox();
	sidxBox.reference_ID = referenceId;
	sidxBox.timescale = timescale;
	sidxBox.earliest_presentation_time = ept;
	sidxBox.first_offset = 0;
	sidxBox.references = refs;
	var stream = new MP4Box.DataStream();
	stream.endianness = MP4Box.DataStream.BIG_ENDIAN;

	mp4boxfile.boxes = [ sidxBox ];
	mp4boxfile.write(stream);

	fs.appendFileSync(filename, new Buffer (new Uint8Array(stream.buffer)));
}

var ref = {
	reference_type: 0,
	referenced_size: 10000,
	subsegment_duration: 224,
	starts_with_SAP: 1,
	SAP_type: 1,
	SAP_delta_time: 0
};

appendSidx(process.argv[2], 1, 24, 0, [ ref ]);
appendSidx(process.argv[2], 1, 24, 0, [ ref ]);

