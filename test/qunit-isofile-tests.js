function makeBoxParsingTest(i) {
	var boxtestIndex = i;
	QUnit.asyncTest(boxtests[boxtestIndex].boxname, function( assert ) {
		var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
		var callback = function (buffer) {
			window.clearTimeout(timeout);
			var file = new ISOFile(new MP4BoxStream(buffer));
			file.parse();
			checkBoxData(assert, file[boxtests[boxtestIndex].boxname], boxtests[boxtestIndex].data);
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
