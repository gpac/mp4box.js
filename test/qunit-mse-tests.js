QUnit.module("MSE");
QUnit.asyncTest( "Appending init segment", function( assert ) {
	var index = 0;
	var track_id;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	var videodiv = document.createElement("div");
	document.body.appendChild(videodiv)
	var video = document.createElement("video");
	videodiv.innerHTML='';
	videodiv.appendChild(video);
	var ms = new MediaSource();

	function onSourceClose(e) {
		console.log("MediaSource closed!");
		window.clearTimeout(timeout);
		assert.ok(false, "MSE closed");
		QUnit.start();
	}

	function onInitAppended(e) {
		window.clearTimeout(timeout);
		assert.equal(ms.readyState, "open", "MSE opened after init append");
		QUnit.start();					
	}

	mp4box.onReady = function(info) { 
		track_id = info.tracks[0].id;
		mp4box.setSegmentOptions(track_id, null, { nbSamples: 10, rapAlignement: true } );
		var initSegs = mp4box.initializeSegmentation();
		var mime = 'video/mp4; codecs=\"'+info.tracks[0].codec+'\"';
		var sb = ms.addSourceBuffer(mime);
		sb.addEventListener("updateend", onInitAppended);
		sb.appendBuffer(initSegs[0].buffer);
	}

	function onSourceOpen(e) {
		getFile(testFiles[index].url, function (buffer) {			
			mp4box.appendBuffer(buffer);
		});
	}

	ms.addEventListener("sourceopen", onSourceOpen);
	ms.addEventListener("sourceclose", onSourceClose);
	video.src = window.URL.createObjectURL(ms);
});

