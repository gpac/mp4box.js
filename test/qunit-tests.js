var testFiles = [
	{
		desc: "non-fragmented MPEG-AVC File",
		url: './h264bl.mp4',
		info_: {"duration":360000,"timescale":600,"isFragmented":false,"isProgressive":true,"hasIOD":true,"brands":["isom","isom"],"created":new Date("2014-04-10T18:23:58.000Z"),"modified":new Date("2014-04-10T18:23:58.000Z"),"tracks":[{"id":1,"references":[],"created":new Date("2012-02-13T23:07:31.000Z"),"modified":new Date("2014-04-10T18:23:59.000Z"),"movie_duration":360000,"layer":0,"alternate_group":0,"volume":0,"matrix":{"0":65536,"1":0,"2":0,"3":0,"4":65536,"5":0,"6":0,"7":0,"8":1073741824},"track_width":320,"track_height":180,"timescale":25000,"duration":15000000,"codec":"avc1.42c00d","language":"und","nb_samples":15000,"video":{"width":320,"height":180}}],"audioTracks":[],"videoTracks":[{"id":1,"references":[],"created":new Date("2012-02-13T23:07:31.000Z"),"modified":new Date("2014-04-10T18:23:59.000Z"),"movie_duration":360000,"layer":0,"alternate_group":0,"volume":0,"matrix":{"0":65536,"1":0,"2":0,"3":0,"4":65536,"5":0,"6":0,"7":0,"8":1073741824},"track_width":320,"track_height":180,"timescale":25000,"duration":15000000,"codec":"avc1.42c00d","language":"und","nb_samples":15000,"video":{"width":320,"height":180}}],"subtitleTracks":[],"metadataTracks":[],"hintTracks":[]}
	},
	{
		desc: "fragmented MPEG-AVC File",
		url: './a.mp4'
	}
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

QUnit.module("One-chunk download and parsing");
for (var i = 0; i < testFiles.length; i++) {
	runBasicTest(i);
}

QUnit.module("2 non-overlapping chunks (mid-moov cut)");
index = 0;
QUnit.asyncTest( testFiles[index].desc, function( assert ) {
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
		getFileRange(testFiles[index].url, 25000, Infinity, function (buffer) {
			mp4box.appendBuffer(buffer);
		});
	});
});

QUnit.module("3 non-overlapping chunks (mid-moov cut, order 1 3 2)");
index = 0;
QUnit.asyncTest( testFiles[index].desc, function( assert ) {
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
		getFileRange(testFiles[index].url, 49999, Infinity, function (buffer) {
			mp4box.appendBuffer(buffer);
			getFileRange(testFiles[index].url, 25000, 50000, function (buffer) {
				mp4box.appendBuffer(buffer);
			});
		});
	});
});

QUnit.module("2 non-overlapping chunks (mid-moov cut), out-of-order");
index = 0;
QUnit.asyncTest( testFiles[index].desc, function( assert ) {
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

	getFileRange(testFiles[index].url, 25000, Infinity, function (buffer) {
		mp4box.appendBuffer(buffer);
		getFileRange(testFiles[index].url, 0, 24999, function (buffer) {
			mp4box.appendBuffer(buffer);
		});
	});
});
