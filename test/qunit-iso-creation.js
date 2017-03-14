QUnit.module("File Creation");

QUnit.test("addSample and segmentation", function( assert ) {
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var f = MP4Box.createFile();
	f.onSegment = function(id, user, buffer, sampleNum) {		
		window.clearTimeout(timeout);
		console.log("Received segment for track "+id);
		assert.ok(true, "Segment received");
	}
	var track_id = f.addTrack();
	f.setSegmentOptions(track_id, null, { nbSamples: 2 } );
	f.initializeSegmentation();
	f.start();
	f.addSample(track_id, new Uint8Array(100));
	f.addSample(track_id, new Uint8Array(100));
});

QUnit.test("addSample and file save", function( assert ) {
	var f = MP4Box.createFile();
	var track_id = f.addTrack();
	f.addSample(track_id, new Uint8Array(100));
	f.addSample(track_id, new Uint8Array(100));
	f.save("test.mp4");
	assert.ok(true, "File created");
});

QUnit.test("Create simple stpp track and save file", function( assert ) {
	Log.setLogLevel(Log.debug);
	var f = MP4Box.createFile();
	var track_id = f.addTrack({ type: "stpp", hdlr: "subt", namespace: "mynamespace"});
	f.addSample(track_id, (new TextEncoder("utf8").encode("<xml></xml>")));
	f.addSample(track_id, (new TextEncoder("utf8").encode("<xml></xml>")));
	f.save("stpp-track.mp4");
	assert.ok(true, "File created");
});

