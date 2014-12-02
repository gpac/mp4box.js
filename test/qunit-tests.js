Log.setLogLevel(Log.d);

var testFiles = [
	{ // 0
		desc: "non-fragmented MP4 file with single MPEG-AVC stream",
		url: './mp4/h264bl.mp4',
		info_: {"duration":360000,"timescale":600,"isFragmented":false,"isProgressive":true,"hasIOD":true,"brands":["isom","isom"],"created":new Date("2014-04-10T18:23:58.000Z"),"modified":new Date("2014-04-10T18:23:58.000Z"),"tracks":[{"id":1,"references":[],"created":new Date("2012-02-13T23:07:31.000Z"),"modified":new Date("2014-04-10T18:23:59.000Z"),"movie_duration":360000,"layer":0,"alternate_group":0,"volume":0,"matrix":{"0":65536,"1":0,"2":0,"3":0,"4":65536,"5":0,"6":0,"7":0,"8":1073741824},"track_width":320,"track_height":180,"timescale":25000,"duration":15000000,"codec":"avc1.42c00d","language":"und","nb_samples":15000,"video":{"width":320,"height":180}}],"audioTracks":[],"videoTracks":[{"id":1,"references":[],"created":new Date("2012-02-13T23:07:31.000Z"),"modified":new Date("2014-04-10T18:23:59.000Z"),"movie_duration":360000,"layer":0,"alternate_group":0,"volume":0,"matrix":{"0":65536,"1":0,"2":0,"3":0,"4":65536,"5":0,"6":0,"7":0,"8":1073741824},"track_width":320,"track_height":180,"timescale":25000,"duration":15000000,"codec":"avc1.42c00d","language":"und","nb_samples":15000,"video":{"width":320,"height":180}}],"subtitleTracks":[],"metadataTracks":[],"hintTracks":[]},
	},
	{ // 1
		desc: "fragmented  MP4 file with single MPEG-AVC stream",
		url: './mp4/a.mp4'
	},
	{ // 2
		desc: "non-fragmented MP4 file with MPEG-4 AAC stream",
		url: './mp4/aaclow.mp4'
	},
	{ // 3
		desc: "non-fragmented MP4 file with two AVC video streams",
		url: './mp4/2v.mp4'
	},
	{ // 4
		desc: "non-fragmented MP4 file with AVC, AAC and WebVTT",
		url: './mp4/avw.mp4'
	},
	{ // 5
		desc: "non-fragmented MP4 file with 1 WebVTT stream",
		url: './mp4/subtitle-srt-wvtt.mp4'
	},
	{ // 6
		desc: "non-fragmented MP4 file with 1 text:tx3g stream",
		url: './mp4/subtitle-srt-tx3g.mp4'
	},
	{ // 7
		desc: "non-fragmented MP4 file with 1 text:stse stream",
		url: './mp4/anim-svg.mp4'
	},
	{ // 8
		desc: "non-fragmented MP4 file with 1 subt:stpp stream",
		url: './mp4/subtitle-ttml-stpp.mp4'
	},
	{ // 9
		desc: "non-fragmented MP4 file with single AVC stream, moov is last box",
		url: './mp4/moov_last.mp4'
	},
	{ // 10
		desc: "long movie",
		url: './mp4/Bad.Influence.se4ep13.mp4'
		//url: './mp4-torrents/g.mp4'
	},
	{ // 11
		desc: "Incomplete file from torrent",
		url: './mp4-torrents/as2-incomplete.mp4'
	}
];

function getFileRange(url, start, end, callback) {
	var xhr = new XMLHttpRequest();
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
		var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 10000);
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
QUnit.test( "appending invalid buffer", function( assert ) {
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
		getFileRange(testFiles[index].url, 70000, Infinity, function (buffer) {
			mp4box.appendBuffer(buffer);
			assert.ok(true, "second buffer appended!" );
			assert.equal(mp4box.nextBuffers.length, 2, "2 buffers remaining" );
			QUnit.start();
		});
	});
});

QUnit.asyncTest( "appending 2 overlapping chunks (mid-mdat cut, incomplete mdat, in order: 1 2)", function( assert ) {
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
		getFileRange(testFiles[index].url, 70000, 100000, function (buffer) {
			mp4box.appendBuffer(buffer);
			assert.ok(true, "second buffer appended!" );
			assert.equal(mp4box.nextBuffers.length, 2, "2 buffers remaining" );
			QUnit.start();
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
		getFileRange(testFiles[index].url, 0, 89999, function (buffer) {
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
		getFileRange(testFiles[index].url, 100000, Infinity, function (buffer) {
			mp4box.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 80000, 99999, function (buffer) {
				mp4box.appendBuffer(buffer);
				assert.equal(mp4box.nextBuffers.length, 3, "3 buffer remaining" );
				QUnit.start();
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
		getFileRange(testFiles[index].url, 80000, 99999, function (buffer) {
			mp4box.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 80000, 99999, function (buffer) {
				mp4box.appendBuffer(buffer);
				getFileRange(testFiles[index].url, 100000, Infinity, function (buffer) {
					mp4box.appendBuffer(buffer);
					assert.equal(mp4box.nextBuffers.length, 3, "3 buffer remaining" );
					QUnit.start();
				});
			});
		});
	});
});

QUnit.asyncTest( "appending twice the whole file as a buffer", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	QUnit.stop();
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
			QUnit.start();
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
		assert.equal(mp4box.nextBuffers.length, 1, "1 buffer stored" );
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
		assert.equal(mp4box.nextBuffers.length, 3, "3 buffer stored" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
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
		assert.equal(mp4box.nextBuffers.length, 2, "2 buffer stored" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
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
		assert.equal(mp4box.nextBuffers.length, 1, "1 buffer stored" );
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
		assert.equal(mp4box.nextBuffers.length, 1, "1 buffer stored" );
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
		assert.equal(mp4box.nextBuffers.length, 1, "1 buffer stored" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 25000, 49999, function (buffer) {
			mp4box.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 20000, 60000, function (buffer) {
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

QUnit.asyncTest( "appending an overlapping smaller buffer", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		assert.equal(mp4box.nextBuffers.length, 1, "1 buffer stored" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 10000, 15000, function (buffer) {
			mp4box.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 25000, Infinity, function (buffer) {
				mp4box.appendBuffer(buffer);
			});
		});
	});
});

QUnit.asyncTest( "appending many overlapping buffers", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		assert.equal(mp4box.nextBuffers.length, 1, "1 buffer stored" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 1000, 80000, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 550, 650, function (buffer) {
			mp4box.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 650, 750, function (buffer) {
				mp4box.appendBuffer(buffer);
				getFileRange(testFiles[index].url, 750, 850, function (buffer) {
					mp4box.appendBuffer(buffer);
					getFileRange(testFiles[index].url, 850, 950, function (buffer) {
						mp4box.appendBuffer(buffer);
						getFileRange(testFiles[index].url, 950, 1050, function (buffer) {
							mp4box.appendBuffer(buffer);
							getFileRange(testFiles[index].url, 0, 1050, function (buffer) {
								mp4box.appendBuffer(buffer);
							});
						});
					});
				});
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

QUnit.asyncTest( "Segmentation without callback", function( assert ) {
	var index = 0;
	var track_id;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
		mp4box.setSegmentOptions(track_id, null, { nbSamples: 10, rapAlignement: true } );
		mp4box.initializeSegmentation();
	}
	getFile(testFiles[index].url, function (buffer) {
		mp4box.appendBuffer(buffer);
		window.clearTimeout(timeout);
		assert.ok(true, "append ended before timeout!" );	
		QUnit.start();
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

QUnit.asyncTest( "Extraction without callback", function( assert ) {
	var index = 0;
	var track_id;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
		mp4box.setExtractionOptions(track_id, null, { nbSamples: 10, rapAlignement: true } );
	}
	getFile(testFiles[index].url, function (buffer) {
		mp4box.appendBuffer(buffer);
		window.clearTimeout(timeout);
		assert.ok(true, "append ended before timeout!" );	
		QUnit.start();
	});
});

QUnit.module("Parsing-driven download");
QUnit.asyncTest( "Moov-last", function( assert ) {
	var mp4box = new MP4Box();

	getFileRange('./mp4/moov_last.mp4', 0, 19, function (buffer) {
		var next_pos = mp4box.appendBuffer(buffer);
		assert.equal(next_pos, 32, "Next position after first append corresponds to next box start");
		getFileRange('./mp4/moov_last.mp4', 20, 39, function (buffer) {
			var next_pos = mp4box.appendBuffer(buffer);
			assert.equal(next_pos, 40, "Next position after second append corresponds to next box start");
			getFileRange('./mp4/moov_last.mp4', 40, 100, function (buffer) {
				var next_pos = mp4box.appendBuffer(buffer);
				assert.equal(next_pos, 1309934+40, "Next position after third append corresponds to moov position");
				QUnit.start();
			});
		});			
	});
});

QUnit.asyncTest( "mdat progressive download", function( assert ) {
	var index = 0;
	var mp4box = new MP4Box();

	getFileRange(testFiles[index].url, 0, 79999, function (buffer) {
		var next_pos = mp4box.appendBuffer(buffer);
		assert.equal(next_pos, 80000, "Next position after first append corresponds to end of previous buffer (moov entirely parsed)");
		getFileRange(testFiles[index].url, 80000, 119999, function (buffer) {
			var next_pos = mp4box.appendBuffer(buffer);
			assert.equal(next_pos, 120000, "Next position after second append corresponds to end of previous buffer (contiguous append)");
			getFileRange(testFiles[index].url, 200000, 259999, function (buffer) {
				var next_pos = mp4box.appendBuffer(buffer);
				assert.equal(next_pos, 120000, "Next position after third append corresponds to end of second buffer (non-contiguous append)");
				getFileRange(testFiles[index].url, 120000, 199999, function (buffer) {
					var next_pos = mp4box.appendBuffer(buffer);
					assert.equal(next_pos, 260000, "Next position after fourth append corresponds to end of all buffer (all-contiguous)");
					QUnit.start();
				});
			});
		});			
	});
});

QUnit.module("Seek tests");
QUnit.asyncTest( "full download and seek at rap 0", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	var seekStep = 0;
	var seekTime = 1.1;
	var doExtraction = false;
	var track_id;
	mp4box.onSamples = function(id, user, samples) {		
		assert.equal(doExtraction, true, "Callback called only when samples are extracted");
		assert.notEqual(seekStep, 2, "Callback should never be reached on step 2");
		assert.equal(samples.length, 1, "One sample received");
		if (seekStep === 0) {
			assert.equal(samples[0].is_rap, true, "Step 0 Sample RAP status matches");
			assert.equal(samples[0].dts, 25000, "Step 0 Sample DTS matches");
			assert.equal(samples[0].cts, 25000, "Step 0 Sample CTS matches");
			assert.equal(samples[0].size, 3158, "Step 0 Sample size matches");
		} else if (seekStep === 1) {
			assert.equal(samples[0].is_rap, false, "Step 1 Sample RAP status matches");
			assert.equal(samples[0].dts, 27000, "Step 1 Sample DTS matches");
			assert.equal(samples[0].cts, 27000, "Step 1 Sample CTS matches");
			assert.equal(samples[0].size, 176, "Step 1 Sample size matches");
		}
		mp4box.unsetExtractionOptions(track_id);
		if (seekStep === 1) {
			window.clearTimeout(timeout);
			QUnit.start();	
		}
	}
	mp4box.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
	}
	getFile(testFiles[index].url, function (buffer) {
		/* appending the whole buffer without setting any extraction option, no sample will be processed */
		mp4box.appendBuffer(buffer);
		
		/* setting extraction option and then seeking and calling sample processing */
		seekStep = 0;
		mp4box.setExtractionOptions(track_id, null, { nbSamples: 1, rapAlignement: true } );
		doExtraction = true;
		mp4box.seek(seekTime, true); // find preceeding rap
		mp4box.flush();

		/* setting extraction option and then seeking and calling sample processing */
		seekStep = 1;
		mp4box.setExtractionOptions(track_id, null, { nbSamples: 1, rapAlignement: true } );
		mp4box.seek(seekTime, false); // don't seek on rap
		mp4box.flush();
		
		seekStep = 2;
		mp4box.seek(10000, false);
	});
});

QUnit.asyncTest( "Seek without moov", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	getFileRange(testFiles[index].url, 0, 10, function (buffer) {
		mp4box.appendBuffer(buffer);
		assert.throws(function() { mp4box.seek(10, true); }, "Exception thrown because moov not found");
		window.clearTimeout(timeout);
		QUnit.start();
	});
});

QUnit.asyncTest( "Seek in the past", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	var seekStep = 0;
	var seekTime0 = 1.1;
	var seekTime1 = 0.1;
	var track_id;
	mp4box.onSamples = function(id, user, samples) {		
		if (seekStep === 0) {
			assert.equal(samples[0].is_rap, true, "Step 0 Sample RAP status matches");
			assert.equal(samples[0].dts, 25000, "Step 0 Sample DTS matches");
			assert.equal(samples[0].cts, 25000, "Step 0 Sample CTS matches");
			assert.equal(samples[0].size, 3158, "Step 0 Sample size matches");
		} else if (seekStep === 1) {
			assert.equal(samples[0].is_rap, true, "Step 1 Sample RAP status matches");
			assert.equal(samples[0].dts, 0, "Step 1 Previous Sample DTS matches");
			assert.equal(samples[0].cts, 0, "Step 1 Sample CTS matches");
			assert.equal(samples[0].size, 3291, "Step 1 Sample size matches");
		}
		mp4box.unsetExtractionOptions(track_id);
		if (seekStep === 1) {
			window.clearTimeout(timeout);
			QUnit.start();	
		}
	}
	mp4box.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
	}
	getFile(testFiles[index].url, function (buffer) {
		/* appending the whole buffer without setting any extraction option, no sample will be processed */
		mp4box.appendBuffer(buffer);
		
		/* setting extraction option and then seeking and calling sample processing */
		seekStep = 0;
		mp4box.setExtractionOptions(track_id, null, { nbSamples: 1, rapAlignement: true } );
		doExtraction = true;
		mp4box.seek(seekTime0, true); // find preceeding rap
		mp4box.flush();

		/* setting extraction option and then seeking and calling sample processing */
		seekStep = 1;
		mp4box.setExtractionOptions(track_id, null, { nbSamples: 1, rapAlignement: true } );
		mp4box.seek(seekTime1, true); // find preceeding rap
		mp4box.flush();
	});
});

QUnit.asyncTest( "Seek and fetch out of order", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	var track_id;
	mp4box.onSamples = function(id, user, samples) {
		console.log("Getting sample for time:"+samples[0].dts/samples[0].timescale);
		if (samples[0].dts === 10000000) {
			window.clearTimeout(timeout);
			QUnit.start();	
		}
	}
	mp4box.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
		/* setting extraction option and then seeking and calling sample processing */
		mp4box.setExtractionOptions(track_id, null, { nbSamples: 1000, rapAlignement: true } );
		/* getting the first 1000 samples */
		getFileRange(testFiles[index].url, 68190, 371814, function (buffer) {
			mp4box.appendBuffer(buffer);
			mp4box.seek(560, true);
			// fetching the last group of 1000 samples in the file
			getFileRange(testFiles[index].url, 3513891, Infinity, function(buffer) {
				mp4box.appendBuffer(buffer);
				mp4box.seek(400, true);
				getFileRange(testFiles[index].url, 2558231, 2797139, function(buffer) {
					mp4box.appendBuffer(buffer);
				});
			});
		});
	
	}
	getFileRange(testFiles[index].url, 0, 68190, function (buffer) {
		/* appending the ftyp/moov */
		mp4box.appendBuffer(buffer);
	});
});

QUnit.module("Write tests");
QUnit.asyncTest( "Generate initialization segment", function( assert ) {
	var index = 0;
	var track_id;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	mp4box.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;		
		mp4box.setSegmentOptions(track_id, null, { nbSamples: 10, rapAlignement: false } );
		assert.ok(mp4box.getInitializationSegment(), "Init segments generated");
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

QUnit.module("Playback test");
QUnit.asyncTest( "Long Segmentation", function( assert ) {
	var index = 10;
	var mp4box = new MP4Box();
	var start = 0;
	var size = 5000000; //1MB
	var nbFragSamples = 10000;
	var lastSample;
	Log.setLogLevel(Log.i);
	function getNext() {
		getFileRange(testFiles[index].url, start, start+size-1, function (buffer) {
			mp4box.appendBuffer(buffer);
			if (buffer.byteLength === size) {
				start += size;
				getNext();
			}
		});
	}
	mp4box.onSegment = function(id, user, buffer, sampleNum) {	
		assert.ok(true, "Segment received!" );
		if (sampleNum === lastSample) {
			mp4box.unsetSegmentOptions(track_id);
			QUnit.start();
		}
	}
	mp4box.onSamples = function(id, user, samples) {	
		assert.ok(true, "Samples received!" );
		console.log("Memory usage: used/total/limit "+console.memory.usedJSHeapSize+"/"+console.memory.totalJSHeapSize+"/"+console.memory.jsHeapSizeLimit);
		if (samples === lastSample) {
			mp4box.unsetSegmentOptions(track_id);
			QUnit.start();
		}
	}
	mp4box.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
		mp4box.setSegmentOptions(track_id, null, { nbSamples: nbFragSamples, rapAlignement: true } );
		if (info.tracks[0].nb_samples % nbFragSamples === 0) {
			lastSample = info.tracks[0].nb_samples - nbFragSamples;	
		} else {
			lastSample = info.tracks[0].nb_samples - info.tracks[0].nb_samples % nbFragSamples;	
		}		
		mp4box.initializeSegmentation();
		getNext();
	}
	getFileRange(testFiles[index].url, start, start+size-1, function (buffer) {
		start += size;
		mp4box.appendBuffer(buffer);
	});
});


QUnit.module("Box parsing tests");
var boxtests = [
					{ 
						url: "./mp4/box/sidx.mp4",	
						boxname: "sidx",
						data: {
							type: "sidx",
							size: 140,
							flags: 0,
							version: 0,
							reference_ID: 1,
							timescale: 24,
							earliest_presentation_time: 0,
							first_offset: 0,
							references: [
								{ 
									type: 0,
									size: 776279,
									duration: 224,
									starts_with_SAP: 1,
									SAP_type: 1,
									SAP_delta_time: 0
								},
								{ 
									type: 0,
									size: 298018,
									duration: 110,
									starts_with_SAP: 1,
									SAP_type: 1,
									SAP_delta_time: 0
								},
								{ 
									type: 0,
									size: 151055,
									duration: 62,
									starts_with_SAP: 1,
									SAP_type: 1,
									SAP_delta_time: 0
								},
								{ 
									type: 0,
									size: 583055,
									duration: 130,
									starts_with_SAP: 1,
									SAP_type: 1,
									SAP_delta_time: 0
								},
								{ 
									type: 0,
									size: 310294,
									duration: 45,
									starts_with_SAP: 1,
									SAP_type: 1,
									SAP_delta_time: 0
								},
								{ 
									type: 0,
									size: 353217,
									duration: 50,
									starts_with_SAP: 1,
									SAP_type: 1,
									SAP_delta_time: 0
								},
								{ 
									type: 0,
									size: 229078,
									duration: 37,
									starts_with_SAP: 1,
									SAP_type: 1,
									SAP_delta_time: 0
								},
								{ 
									type: 0,
									size: 685457,
									duration: 114,
									starts_with_SAP: 1,
									SAP_type: 1,
									SAP_delta_time: 0
								},
								{ 
									type: 0,
									size: 746586,
									duration: 250,
									starts_with_SAP: 1,
									SAP_type: 1,
									SAP_delta_time: 0
								},
								{ 
									type: 0,
									size: 228474,
									duration: 231,
									starts_with_SAP: 1,
									SAP_type: 1,
									SAP_delta_time: 0
								}
							]
						}
					},
					{
						url: "./mp4/box/emsg.m4s",
						boxname: "emsg",
						data: {
							type: "emsg",
							size: 482,
							flags:	0,
							version:	0,
							scheme_id_uri:	"urn:mpeg:dash:event:2012",
							value:	"advert",
							timescale:	1,
							presentation_time_delta:	1,
							event_duration:	1,
							id:	1							
						}
					}
				];

function checkBoxData(assert, box, data) {
	assert.ok(box, "Found "+data.type+" box");
	for (var prop in data) {
		if (Array.isArray(data[prop])) {
			for (var i = 0; i < data[prop].length; i++) {
				var boxentry = box[prop][i];
				var dataentry = data[prop][i];
				for (var entprop in dataentry) {
					assert.equal(boxentry[entprop], dataentry[entprop], "Box property "+prop+", entry #"+i+", property "+entprop+" is correct");
				} 
			}
		} else {
			assert.equal(box[prop], data[prop], "Box property "+prop+" is correct");
		}
	}
}

function makeBoxParsingTest(i) {
	var boxtestIndex = i;
	QUnit.asyncTest( boxtests[boxtestIndex].boxname, function( assert ) {
		var mp4box = new MP4Box();
		getFile(boxtests[boxtestIndex].url, function (buffer) {
			mp4box.appendBuffer(buffer);
			checkBoxData(assert, mp4box.inputIsoFile[boxtests[boxtestIndex].boxname], boxtests[boxtestIndex].data);
			QUnit.start();
		});
	});
}

for (var i = 0; i < boxtests.length; i++) {
	makeBoxParsingTest(i);
}

/*QUnit.module("misc");
QUnit.asyncTest( "Byte-by-byte parsing", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 5000);
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
		for (var i = 0; i < buffer.byteLength; i++) {
			var b1 = new Uint8Array(1);
			var bf = new Uint8Array(buffer);
			b1[0] = bf[i];
			b1.buffer.fileStart = i;
			mp4box.appendBuffer(b1.buffer);
		}
	};
	getFileRange(testFiles[index].url, 0, Infinity, xhr_callback);
});*/

QUnit.asyncTest( "issue #16 (Peersm)", function( assert ) {
	var index = 11;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, 2000);
	var mp4box = new MP4Box();
	QUnit.expect(0);
	getFileRange(testFiles[index].url, 0, 996599, function (buffer) {
		mp4box.appendBuffer(buffer);
		mp4box = new MP4Box();
		getFileRange(testFiles[index].url, 0, 62249, function (buffer) {
			mp4box.appendBuffer(buffer);
			window.clearTimeout(timeout);
			QUnit.start();
		});
	});
});

/* Not yet tested:
 - error on extraction/segmentation settings before onReady
 - onMoovStart event (partial parsing & entire parsing)
 - seek
 - flush
 - track ref
 - segment from fragmentation
 - release samples
 - release buffers
 - extract VTT samples
 - mp4 features
   - edit list
 - boxes:
   - uuid
   - large box
   - version 1: mvhd, tkhd, mdhd, hdlr, ctts, stss, stsh, co64, stsc, stsz, mehd, subs
   - cslg, stsh, co64
 - descriptors:
  - large desc
  - unknown desc
  - depends, url, ocr
 */