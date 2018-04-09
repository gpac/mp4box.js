QUnit.module("Append entire file as one buffer, fire onReady when moov is parsed ");
function runBasicTest(index) {
	QUnit.asyncTest(testFiles[index].desc, function( assert ) {
		var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
		var mp4boxfile = MP4Box.createFile();
		mp4boxfile.onReady = function(info) { 
			window.clearTimeout(timeout);
			assert.ok(true, "moov found!" );
			if (testFiles[index].info) {
				assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
			}
			QUnit.start();
		}
		getFile(testFiles[index].url, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
		});
	});
}

for (var i = 0; i < testFiles.length; i++) {
	runBasicTest(i);
}

QUnit.module("Memory usage");
QUnit.asyncTest( "Moov-last", function( assert ) {
	var index = 9;
	var mp4boxfile = MP4Box.createFile(false);

	getFileRange(testFiles[index].url, 0, 1024*1024-1, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 1024*1024, 2*1024*1024-1, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			assert.equal(mp4boxfile.getAllocatedSampleDataSize(), 0, "All sample bytes are released");
			assert.equal(mp4boxfile.stream.buffers.length, 0, "All buffers have been freed");
			QUnit.start();
		});			
	});
});

QUnit.module("Advanced chunk parsing: non-overlapping");
QUnit.test( "appending invalid buffer", function( assert ) {
	var mp4boxfile = MP4Box.createFile();
	assert.throws(function() { mp4boxfile.appendBuffer(null) }, "Exception thrown because of null buffer");
	assert.throws(function() { mp4boxfile.appendBuffer(new ArrayBuffer()) }, "Exception thrown because of missing fileStart property");
	var b = new ArrayBuffer(0);
	b.fileStart = 0;
	mp4boxfile.appendBuffer(b);
});

QUnit.asyncTest( "appending 2 non-overlapping chunks (mid-moov cut, in order: 1 2)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 25000, Infinity, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
		});
	});
});

QUnit.asyncTest( "appending 2 non-overlapping chunks (mid-mdat cut, in order: 1 2)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	QUnit.stop();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 79999, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 80000, Infinity, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			assert.ok(true, "second buffer appended!" );
			//assert.equal(mp4boxfile.nextBuffers.length, 2, "2 buffers remaining" );
			QUnit.start();
		});
	});
});

QUnit.asyncTest( "appending 2 non-overlapping chunks (mid-moov cut, out-of-order: 2 1)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 25000, Infinity, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
		});
	});
});

QUnit.asyncTest( "appending 2 non-overlapping chunks (mid-mdat cut, out-of-order: 2 1)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 2, "2 buffers remaining" );
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 80000, Infinity, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 0, 79999, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
		});
	});
});

QUnit.asyncTest( "appending 3 non-overlapping chunks (mid-moov cut, order: 1 3 2)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 50000, Infinity, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 25000, 49999, function (buffer) {
				mp4boxfile.appendBuffer(buffer);
			});
		});
	});
});

QUnit.asyncTest( "appending 3 non-overlapping chunks (mid-mdat cut, order: 1 3 2)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	QUnit.stop();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 79999, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 100000, Infinity, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 80000, 99999, function (buffer) {
				mp4boxfile.appendBuffer(buffer);
				//assert.equal(mp4boxfile.nextBuffers.length, 3, "3 buffer remaining" );
				QUnit.start();
			});
		});
	});
});

QUnit.module("Advanced chunk parsing: overlapping buffers");
QUnit.asyncTest( "appending 2 overlapping chunks (mid-moov cut, in order: 1 2)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 24000, Infinity, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
		});
	});
});

QUnit.asyncTest( "appending 2 overlapping chunks (mid-mdat cut, in order: 1 2)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	QUnit.stop();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 79999, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 70000, Infinity, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			assert.ok(true, "second buffer appended!" );
			//assert.equal(mp4boxfile.nextBuffers.length, 2, "2 buffers remaining" );
			QUnit.start();
		});
	});
});

QUnit.asyncTest( "appending 2 overlapping chunks (mid-mdat cut, incomplete mdat, in order: 1 2)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	QUnit.stop();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 79999, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 70000, 100000, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			assert.ok(true, "second buffer appended!" );
			//assert.equal(mp4boxfile.nextBuffers.length, 2, "2 buffers remaining" );
			QUnit.start();
		});
	});
});

QUnit.asyncTest( "appending 2 overlapping chunks (mid-mdat cut, out of order: 2 1)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 2, "2 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 80000, Infinity, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 0, 89999, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
		});
	});
});

QUnit.asyncTest( "appending twice the same small buffer (mid-moov)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 25000, Infinity, function (buffer) {
				mp4boxfile.appendBuffer(buffer);
			});
		});
	});
});

QUnit.asyncTest( "appending twice the same small buffer (mid-mdat)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	QUnit.stop();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 1, "1 buffer remaining" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 79999, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 80000, 99999, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 80000, 99999, function (buffer) {
				mp4boxfile.appendBuffer(buffer);
				getFileRange(testFiles[index].url, 100000, Infinity, function (buffer) {
					mp4boxfile.appendBuffer(buffer);
					//assert.equal(mp4boxfile.nextBuffers.length, 3, "3 buffer remaining" );
					QUnit.start();
				});
			});
		});
	});
});

QUnit.asyncTest( "appending twice the whole file as a buffer", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	QUnit.stop();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, Infinity, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 0, Infinity, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			//assert.equal(mp4boxfile.nextBuffers.length, 1, "1 buffer stored" );
			QUnit.start();
		});
	});
});

QUnit.asyncTest( "appending a smaller duplicated buffer (in moov)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 1, "1 buffer stored" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 0, 9999, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 25000, Infinity, function (buffer) {
				mp4boxfile.appendBuffer(buffer);
			});
		});
	});
});

QUnit.asyncTest( "appending a smaller duplicated buffer (in mdat)", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 3, "3 buffer stored" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 80000, 99999, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 70000, 89999, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 0, 69999, function (buffer) {
				mp4boxfile.appendBuffer(buffer);
			});
		});
	});
});

QUnit.asyncTest( "appending a buffer overlapping on mdat at the beginning", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 2, "2 buffer stored" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 80000, 99999, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 80000, 89999, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 0, 79999, function (buffer) {
				mp4boxfile.appendBuffer(buffer);
			});
		});
	});
});

QUnit.asyncTest( "appending a larger duplicated buffer of another buffer", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 1, "1 buffer stored" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 0, 49999, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 50000, Infinity, function (buffer) {
				mp4boxfile.appendBuffer(buffer);
			});
		});
	});
});

QUnit.asyncTest( "appending an overlapping buffer", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 1, "1 buffer stored" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 10000, 49999, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 50000, Infinity, function (buffer) {
				mp4boxfile.appendBuffer(buffer);
			});
		});
	});
});

QUnit.asyncTest( "appending a buffer overlapping more than one existing buffer", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 1, "1 buffer stored" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 25000, 49999, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 20000, 60000, function (buffer) {
				mp4boxfile.appendBuffer(buffer);
				getFileRange(testFiles[index].url, 60000, Infinity, function (buffer) {
					mp4boxfile.appendBuffer(buffer);
				});
			});
		});
	});
});

QUnit.asyncTest( "appending an overlapping smaller buffer", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 1, "1 buffer stored" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 10000, 15000, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 25000, Infinity, function (buffer) {
				mp4boxfile.appendBuffer(buffer);
			});
		});
	});
});

QUnit.asyncTest( "appending many overlapping buffers", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );
		//assert.equal(mp4boxfile.nextBuffers.length, 1, "1 buffer stored" );
		if (testFiles[index].info) {
			assert.deepEqual(info, testFiles[index].info, "Movie information is correct");
		}
		QUnit.start();
	}

	getFileRange(testFiles[index].url, 1000, 80000, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 550, 650, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 650, 750, function (buffer) {
				mp4boxfile.appendBuffer(buffer);
				getFileRange(testFiles[index].url, 750, 850, function (buffer) {
					mp4boxfile.appendBuffer(buffer);
					getFileRange(testFiles[index].url, 850, 950, function (buffer) {
						mp4boxfile.appendBuffer(buffer);
						getFileRange(testFiles[index].url, 950, 1050, function (buffer) {
							mp4boxfile.appendBuffer(buffer);
							getFileRange(testFiles[index].url, 0, 1050, function (buffer) {
								mp4boxfile.appendBuffer(buffer);
							});
						});
					});
				});
			});
		});
	});
});

QUnit.module("Advanced chunk parsing: misc");
QUnit.asyncTest( "appending only one buffer with fileStart different from zero should not reach onReady", function( assert ) {
	var index = 0;
	var mp4boxfile = MP4Box.createFile();
	QUnit.expect(0);
	mp4boxfile.onReady = function(info) { 
		assert.ok(false, "moov found!" );
	}
	getFileRange(testFiles[index].url, 25000, 49999, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		QUnit.start();
	});
});

QUnit.module("Segmentation/Extraction tests");
QUnit.asyncTest( "Basic Segmentation", function( assert ) {
	var index = 0;
	var track_id;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onSegment = function(id, user, buffer, sampleNum) {		
		assert.ok(true, "First segment received!" );		
		assert.equal(id, track_id, "track id is correct");
		assert.equal(user, null, "user is correct");
		assert.equal(sampleNum, 10, "number of samples is correct");
		assert.ok(buffer.byteLength, "buffer is not empty");
		mp4boxfile.unsetSegmentOptions(track_id);
		window.clearTimeout(timeout);
		QUnit.start();	
	}
	mp4boxfile.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
		mp4boxfile.setSegmentOptions(track_id, null, { nbSamples: 10, rapAlignement: true } );
		mp4boxfile.initializeSegmentation();
		mp4boxfile.start();
	}
	getFile(testFiles[index].url, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
	});
});

QUnit.asyncTest( "Segmentation when no sample is ready should not reach onSegment", function( assert ) {
	var index = 0;
	var track_id;
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onSegment = function(id, user, buffer, sampleNum) {		
		assert.ok(false, "No segment data");
	}
	mp4boxfile.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
		mp4boxfile.setSegmentOptions(track_id, null, { nbSamples: 10, rapAlignement: true } );
		mp4boxfile.initializeSegmentation();
		mp4boxfile.start();
	}
	getFileRange(testFiles[index].url, 0, 68500, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		QUnit.start();	
	});
});

QUnit.asyncTest( "Segmentation without callback", function( assert ) {
	var index = 0;
	var track_id;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
		mp4boxfile.setSegmentOptions(track_id, null, { nbSamples: 10, rapAlignement: true } );
		mp4boxfile.initializeSegmentation();
		mp4boxfile.start();
	}
	getFile(testFiles[index].url, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		window.clearTimeout(timeout);
		assert.ok(true, "append ended before timeout!" );	
		QUnit.start();
	});
});

QUnit.asyncTest( "Basic Extraction", function( assert ) {
	var index = 0;
	var track_id;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onSamples = function(id, user, samples) {		
		assert.ok(true, "First extracted samples received!" );		
		assert.equal(id, track_id, "track id is correct");
		assert.equal(user, null, "user is correct");
		assert.equal(samples.length, 10, "got 10 samples!");
		mp4boxfile.unsetExtractionOptions(track_id);
		window.clearTimeout(timeout);
		QUnit.start();	
	}
	mp4boxfile.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
		mp4boxfile.setExtractionOptions(track_id, null, { nbSamples: 10, rapAlignement: true } );
		mp4boxfile.start();
	}
	getFile(testFiles[index].url, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
	});
});

QUnit.asyncTest( "Extraction when no sample is ready should not reach onSamples", function( assert ) {
	var index = 0;
	var track_id;
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onSamples = function(id, user, samples) {		
		assert.ok(false, "No sample data");
	}
	mp4boxfile.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
		mp4boxfile.setExtractionOptions(track_id, null, { nbSamples: 10, rapAlignement: true } );
		mp4boxfile.start();
	}
	getFileRange(testFiles[index].url, 0, 68500, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		QUnit.start();
	});
});

QUnit.asyncTest( "Extraction without callback", function( assert ) {
	var index = 0;
	var track_id;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
		mp4boxfile.setExtractionOptions(track_id, null, { nbSamples: 10, rapAlignement: true } );
		mp4boxfile.start();
	}
	getFile(testFiles[index].url, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		window.clearTimeout(timeout);
		assert.ok(true, "append ended before timeout!" );	
		QUnit.start();
	});
});

QUnit.module("Parsing-driven download");
QUnit.asyncTest( "Moov-last", function( assert ) {
	var index = 9;
	var mp4boxfile = MP4Box.createFile();

	getFileRange(testFiles[index].url, 0, 19, function (buffer) {
		var next_pos = mp4boxfile.appendBuffer(buffer);
		assert.equal(next_pos, 32, "Next position after first append corresponds to next box start");
		getFileRange(testFiles[index].url, 20, 39, function (buffer) {
			var next_pos = mp4boxfile.appendBuffer(buffer);
			assert.equal(next_pos, 40, "Next position after second append corresponds to next box start");
			getFileRange(testFiles[index].url, 40, 100, function (buffer) {
				var next_pos = mp4boxfile.appendBuffer(buffer);
				assert.equal(next_pos, 1309934+40, "Next position after third append corresponds to moov position");
				QUnit.start();
			});
		});			
	});
});

QUnit.asyncTest( "mdat progressive download", function( assert ) {
	var index = 0;
	var mp4boxfile = MP4Box.createFile();

	getFileRange(testFiles[index].url, 0, 79999, function (buffer) {
		var next_pos = mp4boxfile.appendBuffer(buffer);
		assert.equal(next_pos, 80000, "Next position after first append corresponds to end of previous buffer (moov entirely parsed)");
		getFileRange(testFiles[index].url, 80000, 119999, function (buffer) {
			var next_pos = mp4boxfile.appendBuffer(buffer);
			assert.equal(next_pos, 120000, "Next position after second append corresponds to end of previous buffer (contiguous append)");
			getFileRange(testFiles[index].url, 200000, 259999, function (buffer) {
				var next_pos = mp4boxfile.appendBuffer(buffer);
				assert.equal(next_pos, 120000, "Next position after third append corresponds to end of second buffer (non-contiguous append)");
				getFileRange(testFiles[index].url, 120000, 199999, function (buffer) {
					var next_pos = mp4boxfile.appendBuffer(buffer);
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
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	var seekStep = 0;
	var seekTime = 1.1;
	var doExtraction = false;
	var track_id;
	mp4boxfile.onSamples = function(id, user, samples) {		
		assert.equal(doExtraction, true, "Callback called only when samples are extracted");
		assert.notEqual(seekStep, 2, "Callback should never be reached on step 2");
		assert.equal(samples.length, 1, "One sample received");
		if (seekStep === 0) {
			assert.equal(samples[0].is_sync, true, "Step 0 Sample RAP status matches");
			assert.equal(samples[0].dts, 25000, "Step 0 Sample DTS matches");
			assert.equal(samples[0].cts, 25000, "Step 0 Sample CTS matches");
			assert.equal(samples[0].size, 3158, "Step 0 Sample size matches");
		} else if (seekStep === 1) {
			assert.equal(samples[0].is_sync, false, "Step 1 Sample RAP status matches");
			assert.equal(samples[0].dts, 27000, "Step 1 Sample DTS matches");
			assert.equal(samples[0].cts, 27000, "Step 1 Sample CTS matches");
			assert.equal(samples[0].size, 176, "Step 1 Sample size matches");
		}
		mp4boxfile.unsetExtractionOptions(track_id);
		if (seekStep === 1) {
			window.clearTimeout(timeout);
			QUnit.start();	
		}
	}
	mp4boxfile.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
	}
	getFile(testFiles[index].url, function (buffer) {
		// appending the whole buffer without setting any extraction option, no sample will be processed 
		mp4boxfile.appendBuffer(buffer);
		
		// setting extraction option and then seeking and calling sample processing 
		seekStep = 0;
		mp4boxfile.setExtractionOptions(track_id, null, { nbSamples: 1, rapAlignement: true } );
		doExtraction = true;
		mp4boxfile.seek(seekTime, true); // find preceeding rap
		mp4boxfile.start();

		// setting extraction option and then seeking and calling sample processing 
		seekStep = 1;
		mp4boxfile.setExtractionOptions(track_id, null, { nbSamples: 1, rapAlignement: true } );
		mp4boxfile.seek(seekTime, false); // don't seek on rap
		mp4boxfile.flush();
		
		seekStep = 2;
		mp4boxfile.seek(10000, false);
	});
});

QUnit.asyncTest( "Seek without moov", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	getFileRange(testFiles[index].url, 0, 10, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		assert.throws(function() { mp4boxfile.seek(10, true); }, "Exception thrown because moov not found");
		window.clearTimeout(timeout);
		QUnit.start();
	});
});

QUnit.asyncTest( "Seek in the past", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	var seekStep = 0;
	var seekTime0 = 1.1;
	var seekTime1 = 0.1;
	var track_id;
	mp4boxfile.onSamples = function(id, user, samples) {		
		if (seekStep === 0) {
			assert.equal(samples[0].is_sync, true, "Step 0 Sample RAP status matches");
			assert.equal(samples[0].dts, 25000, "Step 0 Sample DTS matches");
			assert.equal(samples[0].cts, 25000, "Step 0 Sample CTS matches");
			assert.equal(samples[0].size, 3158, "Step 0 Sample size matches");
		} else if (seekStep === 1) {
			assert.equal(samples[0].is_sync, true, "Step 1 Sample RAP status matches");
			assert.equal(samples[0].dts, 0, "Step 1 Previous Sample DTS matches");
			assert.equal(samples[0].cts, 0, "Step 1 Sample CTS matches");
			assert.equal(samples[0].size, 3291, "Step 1 Sample size matches");
		}
		mp4boxfile.unsetExtractionOptions(track_id);
		if (seekStep === 1) {
			window.clearTimeout(timeout);
			QUnit.start();	
		}
	}
	mp4boxfile.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
	}
	getFile(testFiles[index].url, function (buffer) {
		// appending the whole buffer without setting any extraction option, no sample will be processed 
		mp4boxfile.appendBuffer(buffer);
		
		// setting extraction option and then seeking and calling sample processing 
		seekStep = 0;
		mp4boxfile.setExtractionOptions(track_id, null, { nbSamples: 1, rapAlignement: true } );
		mp4boxfile.seek(seekTime0, true); // find preceeding rap
		mp4boxfile.start();

		// setting extraction option and then seeking and calling sample processing 
		seekStep = 1;
		mp4boxfile.setExtractionOptions(track_id, null, { nbSamples: 1, rapAlignement: true } );
		mp4boxfile.seek(seekTime1, true); // find preceeding rap
		mp4boxfile.flush();
	});
});

QUnit.asyncTest( "Seek and fetch out of order", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	var track_id;
	mp4boxfile.onSamples = function(id, user, samples) {
		Log.info("Getting sample for time:"+samples[0].dts/samples[0].timescale);
		if (samples[0].dts === 10000000) {
			window.clearTimeout(timeout);
			QUnit.start();	
		}
	}
	mp4boxfile.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
		// setting extraction option and then seeking and calling sample processing 
		mp4boxfile.setExtractionOptions(track_id, null, { nbSamples: 1000, rapAlignement: true } );
		mp4boxfile.start();

		// getting the first 1000 samples 
		getFileRange(testFiles[index].url, 68190, 371814, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			mp4boxfile.seek(560, true);
			// fetching the last group of 1000 samples in the file
			getFileRange(testFiles[index].url, 3513891, Infinity, function(buffer) {
				mp4boxfile.appendBuffer(buffer);
				mp4boxfile.seek(400, true);
				getFileRange(testFiles[index].url, 2558231, 2797139, function(buffer) {
					mp4boxfile.appendBuffer(buffer);
				});
			});
		});
	
	}
	getFileRange(testFiles[index].url, 0, 68190, function (buffer) {
		// appending the ftyp/moov 
		mp4boxfile.appendBuffer(buffer);
	});
});

QUnit.module("Write tests");
QUnit.asyncTest( "Generate initialization segment", function( assert ) {
	var index = 0;
	var track_id;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;		
		mp4boxfile.setSegmentOptions(track_id, null, { nbSamples: 10, rapAlignement: false } );
		assert.ok(mp4boxfile.initializeSegmentation(), "Init segments generated");
		QUnit.start();	
	}
	getFile(testFiles[index].url, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
	});
});

QUnit.asyncTest( "Write-back the entire file", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
		window.clearTimeout(timeout);
		assert.ok(true, "moov found!" );	
		var b = mp4boxfile.getBuffer();
		QUnit.start();	
	}
	getFile(testFiles[index].url, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
	});
});

/*QUnit.module("Playback test");
QUnit.asyncTest( "Long Segmentation", function( assert ) {
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var index = 10;
	var mp4boxfile = MP4Box.createFile();
	var start = 0;
	var size = 5000000; //1MB
	var nbFragSamples = 10000;
	var lastSample;
	var track_id;
	Log.setLogLevel(Log.i);
	function getNext() {
		getFileRange(testFiles[index].url, start, start+size-1, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			if (buffer.byteLength === size) {
				start += size;
				getNext();
			}
		});
	}
	mp4boxfile.onSegment = function(id, user, buffer, sampleNum) {	
		assert.ok(true, "Segment received!" );
		if (sampleNum === lastSample) {
			window.clearTimeout(timeout);
			mp4boxfile.unsetSegmentOptions(track_id);
			QUnit.start();
		}
	}
	mp4boxfile.onReady = function(info) { 
		assert.ok(true, "moov found!" );	
		track_id = info.tracks[0].id;
		mp4boxfile.setSegmentOptions(track_id, null, { nbSamples: nbFragSamples, rapAlignement: true } );
		if (info.tracks[0].nb_samples % nbFragSamples === 0) {
			lastSample = info.tracks[0].nb_samples - nbFragSamples;	
		} else {
			lastSample = info.tracks[0].nb_samples - info.tracks[0].nb_samples % nbFragSamples;	
		}		
		mp4boxfile.initializeSegmentation();
		mp4boxfile.start();		
		getNext();
	}
	getFileRange(testFiles[index].url, start, start+size-1, function (buffer) {
		start += size;
		mp4boxfile.appendBuffer(buffer);
	});
});*/


QUnit.module("Box parsing tests");
function makeBoxParsingTest(i) {
	var boxtestIndex = i;
	QUnit.asyncTest( boxtests[boxtestIndex].boxname, function( assert ) {
		var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
		var mp4boxfile = MP4Box.createFile();
		var callback = function (buffer) {
			window.clearTimeout(timeout);
			buffer.fileStart = 0;
			mp4boxfile.appendBuffer(buffer);
			checkBoxData(assert, mp4boxfile[boxtests[boxtestIndex].boxname], boxtests[boxtestIndex].data);
			QUnit.start();
		};
		var rangeStart = boxtests[boxtestIndex].rangeStart || 0;
		var rangeEnd = (boxtests[boxtestIndex].rangeSize+boxtests[boxtestIndex].rangeStart-1) || Infinity;
		getFileRange(boxtests[boxtestIndex].url, rangeStart, rangeEnd, callback);
	});
}

for (var i = 0; i < boxtests.length; i++) {
	makeBoxParsingTest(i);
}

QUnit.module("Box read/write/read tests");
function makeBoxReadWriteReadTest(i) {
	var boxtestIndex = i;
	QUnit.asyncTest( boxtests[boxtestIndex].boxname, function( assert ) {
		var boxref;
		var mp4box_read_ref = MP4Box.createFile();
		var mp4box_write = MP4Box.createFile();
		var written_buffer;
		var mp4box_read_written = MP4Box.createFile();
		var callback = function (buffer) {
			buffer.fileStart = 0;
			mp4box_read_ref.appendBuffer(buffer);
			boxref = mp4box_read_ref[boxtests[boxtestIndex].boxname];
			mp4box_write.boxes.push(boxref);
			written_buffer = mp4box_write.getBuffer();
			written_buffer.fileStart = 0;
			mp4box_read_written.appendBuffer(written_buffer);
			checkBoxData(assert, mp4box_read_written[boxtests[boxtestIndex].boxname], boxref);
			QUnit.start();
		};
		var rangeStart = boxtests[boxtestIndex].rangeStart || 0;
		var rangeEnd = (boxtests[boxtestIndex].rangeSize+boxtests[boxtestIndex].rangeStart-1) || Infinity;
		getFileRange(boxtests[boxtestIndex].url, rangeStart, rangeEnd, callback);
	});
}

for (var i = 1; i < boxtests.length; i++) {
	makeBoxReadWriteReadTest(i);
}


/*QUnit.module("misc");
QUnit.asyncTest( "Byte-by-byte parsing", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) { 
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
			mp4boxfile.appendBuffer(b1.buffer);
		}
	};
	getFileRange(testFiles[index].url, 0, Infinity, xhr_callback);
});*/

QUnit.module("misc");
QUnit.asyncTest( "issue #16 (Peersm)", function( assert ) {
	var index = 10;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	QUnit.expect(0);
	getFileRange(testFiles[index].url, 0, 996599, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		mp4boxfile = MP4Box.createFile();
		getFileRange(testFiles[index].url, 0, 62249, function (buffer) {
			mp4boxfile.appendBuffer(buffer);
			window.clearTimeout(timeout);
			QUnit.start();
		});
	});
});

QUnit.asyncTest( "moov-first, parsed, append a non-contiguous buffer", function( assert ) {
	var index = 0;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile();
	getFileRange(testFiles[index].url, 0, testFiles[index].moovEnd, function (buffer) {
		mp4boxfile.appendBuffer(buffer);
		getFileRange(testFiles[index].url, testFiles[index].moovEnd+100, testFiles[index].moovEnd+1000, function (buffer) {
			window.clearTimeout(timeout);
			var nextFileStart = mp4boxfile.appendBuffer(buffer);
			assert.equal(nextFileStart, testFiles[index].moovEnd+1, "next parsing position should be immediately after the moov");
			QUnit.start();
		});
	});
});

QUnit.asyncTest( "Moov-last, parsed, append buffer not starting at mdat start", function( assert ) {
	var index = 9;
	var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
	var mp4boxfile = MP4Box.createFile(false);
	var nextStart;
	/* fetching first enough to know the size of mdat to skip */
	getFileRange(testFiles[index].url, 0, testFiles[index].mdatStart+8-1, function (buffer) {
		nextStart = mp4boxfile.appendBuffer(buffer);
		assert.equal(nextStart, testFiles[index].mdatStart+testFiles[index].mdatSize, "next parsing position should be after mdat");
		// fetching the moov box
		getFileRange(testFiles[index].url, testFiles[index].mdatStart+testFiles[index].mdatSize, nextStart+testFiles[index].moovSize-1, function (buffer) {
			window.clearTimeout(timeout);
			nextStart = mp4boxfile.appendBuffer(buffer);
			assert.equal(nextStart, testFiles[index].mdatStart+testFiles[index].mdatSize+testFiles[index].moovSize, "Next parse position should be after moov");
			QUnit.start();
		});			
	});
});
