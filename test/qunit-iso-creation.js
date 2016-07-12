QUnit.module("File Creation");

QUnit.test("addSample and segmentation", function( assert ) {
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var f = MP4Box.createFile();
	f.onSegment = function(id, user, buffer, sampleNum) {		
		window.clearTimeout(timeout);
		console.log("Received segment for track "+id);
		assert.ok(true, "Segment received");
	}
	var t = f.addTrack();
	f.setSegmentOptions(1, null, { nbSamples: 2 } );
	f.initializeSegmentation();
	f.start();
	f.addSample(t, new Uint8Array(100));
	f.addSample(t, new Uint8Array(100));
});

QUnit.test("addSample and file save", function( assert ) {
	var f = MP4Box.createFile();
	var t = f.addTrack();
	f.addSample(t, new Uint8Array(100));
	f.addSample(t, new Uint8Array(100));
	f.save("test.mp4");
	assert.ok(true, "File created");
});
