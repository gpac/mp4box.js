Log.setLogLevel(Log.d);

var testFiles = [
	{
		desc: "non-fragmented MP4 file with single MPEG-AVC stream",
		url: './h264bl.mp4',
		info_: {"duration":360000,"timescale":600,"isFragmented":false,"isProgressive":true,"hasIOD":true,"brands":["isom","isom"],"created":new Date("2014-04-10T18:23:58.000Z"),"modified":new Date("2014-04-10T18:23:58.000Z"),"tracks":[{"id":1,"references":[],"created":new Date("2012-02-13T23:07:31.000Z"),"modified":new Date("2014-04-10T18:23:59.000Z"),"movie_duration":360000,"layer":0,"alternate_group":0,"volume":0,"matrix":{"0":65536,"1":0,"2":0,"3":0,"4":65536,"5":0,"6":0,"7":0,"8":1073741824},"track_width":320,"track_height":180,"timescale":25000,"duration":15000000,"codec":"avc1.42c00d","language":"und","nb_samples":15000,"video":{"width":320,"height":180}}],"audioTracks":[],"videoTracks":[{"id":1,"references":[],"created":new Date("2012-02-13T23:07:31.000Z"),"modified":new Date("2014-04-10T18:23:59.000Z"),"movie_duration":360000,"layer":0,"alternate_group":0,"volume":0,"matrix":{"0":65536,"1":0,"2":0,"3":0,"4":65536,"5":0,"6":0,"7":0,"8":1073741824},"track_width":320,"track_height":180,"timescale":25000,"duration":15000000,"codec":"avc1.42c00d","language":"und","nb_samples":15000,"video":{"width":320,"height":180}}],"subtitleTracks":[],"metadataTracks":[],"hintTracks":[]},
	},
	{
		desc: "fragmented  MP4 file with single MPEG-AVC stream",
		url: './a.mp4'
	},
	{
		desc: "non-fragmented MP4 file with MPEG-4 AAC stream",
		url: './aaclow.mp4'
	},
	{
		desc: "non-fragmented MP4 file with two AVC video streams",
		url: './aaclow.mp4'
	},
	{
		desc: "non-fragmented MP4 file with AVC, AAC and WebVTT",
		url: './avw.mp4'
	},
	{
		desc: "non-fragmented MP4 file with 1 WebVTT stream",
		url: './subtitle-srt-wvtt.mp4'
	},
	{
		desc: "non-fragmented MP4 file with 1 text:tx3g stream",
		url: './subtitle-srt-tx3g.mp4'
	},
	{
		desc: "non-fragmented MP4 file with 1 subt:stpp stream",
		url: './subtitle-ttml-stpp.mp4'
	},
	{
		desc: "non-fragmented MP4 file with single AVC stream, moov is last box",
		url: './moov_last.mp4'
	},
];

function getFileRange(url, start, end, callback) {
	var xhr = new XMLHttpRequest;
	xhr.open("GET", url, true);
	xhr.responseType = "arraybuffer";
	if (start !== 0 || end !== Infinity) {
		xhr.setRequestHeader('Range', 'bytes=' + start + '-' + (end == Infinity ? '':end));
	}
	xhr.onreadystatechange = function (e) { 
		if ((xhr.status == 200 || xhr.status == 206 || xhr.status == 304 || xhr.status == 416) && xhr.readyState == this.DONE) {
			xhr.response.fileStart = start;
			callback(xhr.response); 
		}
	};
	xhr.send();
}

function getFile(url, callback) {
	getFileRange(url, 0, Infinity, callback);
}

function runBasicTest(index) {
	QUnit.asyncTest(testFiles[index].desc, function( assert ) {
		var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
		var mp4box = new MP4Box();
		mp4box.onReady = function(info) { 
			window.clearTimeout(timeout);
			assert.ok(true, "moov found!" );
			if (testFiles[index].info) {
				assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
			}
			QUnit.start();
		}
		getFile(testFiles[index].url, function (buffer) {
			mp4box.appendBuffer(buffer);
		});
	});
}

QUnit.module("One-chunk parsing and fire onReady when moov is parsed ");
for (var i = 0; i < testFiles.length; i++) {
	runBasicTest(i);
}

QUnit.module("Advanced chunk parsing");
QUnit.test( "appending wrong buffer", function( assert ) {
	var mp4box = new MP4Box();
	assert.throws(function() { mp4box.appendBuffer(null) }, "Exception thrown because of null buffer");
	assert.throws(function() { mp4box.appendBuffer(new ArrayBuffer()) }, "Exception thrown because of missing fileStart property");
	var b = new ArrayBuffer(0);
	b.fileStart = 0;
	mp4box.appendBuffer(b);
});

QUnit.asyncTest( "appending 2 non-overlapping chunks (mid-moov cut, in order: 1 2)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		assert.equal(mp4box.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 25000, Infinity, function (buffer) {
			mp4box.appendBuffer(buffer);
		});
	});
});

QUnit.asyncTest( "appending 2 non-overlapping chunks (mid-mdat cut, in order: 1 2)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	QUnit.stop();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		assert.equal(mp4box.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 79999, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 80000, Infinity, function (buffer) {
			mp4box.appendBuffer(buffer);
			assert.ok(true, "second buffer appended!" );
			assert.equal(mp4box.nextBuffers.length, 2, "2 buffers remaining" );
			QUnit.start();
		});
	});
});

QUnit.asyncTest( "appending 2 non-overlapping chunks (mid-moov cut, out-of-order: 2 1)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		assert.equal(mp4box.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 25000, Infinity, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
			mp4box.appendBuffer(buffer);
		});
	});
});

QUnit.asyncTest( "appending 2 non-overlapping chunks (mid-mdat cut, out-of-order: 2 1)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		assert.equal(mp4box.nextBuffers.length, 2, "2 buffers remaining" );
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 80000, Infinity, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 0, 79999, function (buffer) {
			mp4box.appendBuffer(buffer);
		});
	});
});

QUnit.asyncTest( "appending 2 overlapping chunks (mid-moov cut, in order: 1 2)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		assert.equal(mp4box.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 24000, Infinity, function (buffer) {
			mp4box.appendBuffer(buffer);
		});
	});
});

QUnit.asyncTest( "appending 2 overlapping chunks (mid-mdat cut, in order: 1 2)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		assert.equal(mp4box.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 79999, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 80000, Infinity, function (buffer) {
			mp4box.appendBuffer(buffer);
		});
	});
});

QUnit.asyncTest( "appending 2 overlapping chunks (mid-mdat cut, incomplete mdat, in order: 1 2)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		assert.equal(mp4box.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 79999, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 80000, 100000, function (buffer) {
			mp4box.appendBuffer(buffer);
		});
	});
});

QUnit.asyncTest( "appending 2 overlapping chunks (mid-mdat cut, out of order: 2 1)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		assert.equal(mp4box.nextBuffers.length, 2, "2 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 80000, Infinity, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 0, 79999, function (buffer) {
			mp4box.appendBuffer(buffer);
		});
	});
});

QUnit.asyncTest( "appending 3 non-overlapping chunks (mid-moov cut, order: 1 3 2)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		assert.equal(mp4box.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 50000, Infinity, function (buffer) {
			mp4box.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 25000, 49999, function (buffer) {
				mp4box.appendBuffer(buffer);
			});
		});
	});
});

QUnit.asyncTest( "appending 3 non-overlapping chunks (mid-mdat cut, order: 1 3 2)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		assert.equal(mp4box.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 79999, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 100000, Infinity, function (buffer) {
			mp4box.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 80000, 99999, function (buffer) {
				mp4box.appendBuffer(buffer);
			});
		});
	});
});

QUnit.asyncTest( "appending twice the same small buffer (mid-moov)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		assert.equal(mp4box.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
			mp4box.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 25000, Infinity, function (buffer) {
				mp4box.appendBuffer(buffer);
			});
		});
	});
});

QUnit.asyncTest( "appending twice the same small buffer (mid-mdat)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		assert.equal(mp4box.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 79999, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 80000, 99999, function (buffer) {
			mp4box.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 80000, 99999, function (buffer) {
				mp4box.appendBuffer(buffer);
				getFileRange(testFiles[index].url, 100000, Infinity, function (buffer) {
					mp4box.appendBuffer(buffer);
				});
			});
		});
	});
});

QUnit.asyncTest( "appending twice the whole file as a buffer", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, Infinity, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 0, Infinity, function (buffer) {
			mp4box.appendBuffer(buffer);
			assert.equal(mp4box.nextBuffers.length, 1, "1 buffer stored" );
		});
	});
});

QUnit.asyncTest( "appending a smaller duplicated buffer (in moov)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 0, 9999, function (buffer) {
			mp4box.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 25000, Infinity, function (buffer) {
				mp4box.appendBuffer(buffer);
			});
		});
	});
});

QUnit.asyncTest( "appending a smaller duplicated buffer (in mdat)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 80000, 99999, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 70000, 89999, function (buffer) {
			mp4box.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 0, 69999, function (buffer) {
				mp4box.appendBuffer(buffer);
			});
		});
	});
});

QUnit.asyncTest( "appending a buffer overlapping on mdat at the beginning", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 80000, 99999, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 80000, 89999, function (buffer) {
			mp4box.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 0, 79999, function (buffer) {
				mp4box.appendBuffer(buffer);
			});
		});
	});
});

QUnit.asyncTest( "appending a larger duplicated buffer of another buffer", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 0, 49999, function (buffer) {
			mp4box.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 50000, Infinity, function (buffer) {
				mp4box.appendBuffer(buffer);
			});
		});
	});
});

QUnit.asyncTest( "appending an overlapping buffer", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 10000, 49999, function (buffer) {
			mp4box.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 50000, Infinity, function (buffer) {
				mp4box.appendBuffer(buffer);
			});
		});
	});
});

QUnit.asyncTest( "appending a buffer overlapping more than one existing buffer", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 25000, 49999, function (buffer) {
			mp4box.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 20000, Infinity, function (buffer) {
				mp4box.appendBuffer(buffer);
				getFileRange(testFiles[index].url, 60000, Infinity, function (buffer) {
					mp4box.appendBuffer(buffer);
				});
			});
		});
	});
});

QUnit.asyncTest( "appending only one buffer with fileStart different from zero", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(true, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(false, "moov found!" );
		QUnit.start();
	}
	getFileRange(testFiles[index].url, 25000, 49999, function (buffer) {
		mp4box.appendBuffer(buffer);
	});
});

QUnit.module("Parsing-driven download");
QUnit.asyncTest( "Moov-last", function( assert ) {
	var mp4box = new MP4Box();

	getFileRange('./moov_last.mp4', 0, 19, function (buffer) {
		var next_pos = mp4box.appendBuffer(buffer);
		assert.equal(next_pos, 32, "Next position after first append corresponds to next box start");
		getFileRange('./moov_last.mp4', 20, 39, function (buffer) {
			var next_pos = mp4box.appendBuffer(buffer);
			assert.equal(next_pos, 40, "Next position after second append corresponds to next box start");
			getFileRange('./moov_last.mp4', 40, 100, function (buffer) {
				var next_pos = mp4box.appendBuffer(buffer);
				assert.equal(next_pos, 1309934+40, "Next position after third append corresponds to moov position");
				QUnit.start();
			});
		});			
	});
});

QUnit.module("Segmentation/Extraction tests");
QUnit.asyncTest( "Basic Segmentation", function( assert ) {
	var index = 0;
	var track_id;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onSegment = function(id, user, buffer, sampleNum) {		
		assert.ok(true, "First segment received!" );		
		assert.equal(id, track_id, "track id is correct");
		assert.equal(user, null, "user is correct");
		assert.equal(sampleNum, 10, "number of samples is correct");
		assert.ok(buffer.byteLength, "buffer is not empty");
		mp4box.unsetSegmentOptions(track_id);
		window.clearTimeout(timeout);
		QUnit.start();	
	}
	mp4box.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
		mp4box.setSegmentOptions(track_id, null, { nbSamples: 10, rapAlignement: true } );
		mp4box.initializeSegmentation();
	}
	getFile(testFiles[index].url, function (buffer) {
			mp4box.appendBuffer(buffer);
	});
});

QUnit.asyncTest( "Segmentation when no sample is ready", function( assert ) {
	var index = 0;
	var track_id;
	var timeout = window.setTimeout(function() { assert.ok(true, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onSegment = function(id, user, buffer, sampleNum) {		
		assert.ok(false, "No segment data");
		QUnit.start();	
	}
	mp4box.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
		mp4box.setSegmentOptions(track_id, null, { nbSamples: 10, rapAlignement: true } );
		mp4box.initializeSegmentation();
	}
	getFileRange(testFiles[index].url, 0, 68500, function (buffer) {
			mp4box.appendBuffer(buffer);
	});
});

QUnit.asyncTest( "Basic Extraction", function( assert ) {
	var index = 0;
	var track_id;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onSamples = function(id, user, samples) {		
		assert.ok(true, "First extracted samples received!" );		
		assert.equal(id, track_id, "track id is correct");
		assert.equal(user, null, "user is correct");
		assert.equal(samples.length, 10, "got 10 samples!");
		mp4box.unsetExtractionOptions(track_id);
		window.clearTimeout(timeout);
		QUnit.start();	
	}
	mp4box.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
		mp4box.setExtractionOptions(track_id, null, { nbSamples: 10, rapAlignement: true } );
	}
	getFile(testFiles[index].url, function (buffer) {
			mp4box.appendBuffer(buffer);
	});
});

QUnit.asyncTest( "Extraction when no sample is ready", function( assert ) {
	var index = 0;
	var track_id;
	var timeout = window.setTimeout(function() { assert.ok(true, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onSamples = function(id, user, samples) {		
		assert.ok(false, "No sample data");
		QUnit.start();	
	}
	mp4box.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
		mp4box.setExtractionOptions(track_id, null, { nbSamples: 10, rapAlignement: true } );
	}
	getFileRange(testFiles[index].url, 0, 68500, function (buffer) {
			mp4box.appendBuffer(buffer);
	});
});

QUnit.module("Write tests");
QUnit.asyncTest( "Basic", function( assert ) {
	var index = 0;
	var track_id;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	QUnit.stop();	
	mp4box.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;		
		mp4box.setSegmentOptions(track_id, null, { nbSamples: 10, rapAlignement: false } );
		mp4box.getInitializationSegment();
		QUnit.start();	
	}
	getFile(testFiles[index].url, function (buffer) {
			mp4box.appendBuffer(buffer);
	});
});

QUnit.asyncTest( "Write-back the entire file", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );	
		var b = mp4box.writeFile();
		QUnit.start();	
	}
	getFile(testFiles[index].url, function (buffer) {
			mp4box.appendBuffer(buffer);
	});
});

QUnit.module("misc");
QUnit.asyncTest( "Byte-by-byte parsing", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}
	var xhr_callback = function (buffer) {
		for (var i = 0; i < 100; i++) {
			var b1 = new Uint8Array(1);
			var bf = new Uint8Array(buffer);
			b1[0] = bf[i];
			b1.buffer.fileStart = i;
			mp4box.appendBuffer(b1.buffer);
		}
	};
	getFileRange(testFiles[index].url, 0, Infinity, xhr_callback);
});

/* Not yet tested:
 - seek
 - flush
 - track ref
 - segment from fragmentation
 - release samples
 - release buffers
 - extract VTT samples
 - boxes:
   - uuid
   - large box
   - version 1: mvhd, tkhd, mdhd, hdlr, ctts, stss, stsh, co64, stsc, stsz, mehd, subs
   - cslg, stsh, co64
 - descriptors:
  - 
 */