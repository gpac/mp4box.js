function makeBoxParsingTest(fileIndex) {
	QUnit.asyncTest(conformanceFiles[fileIndex], function( assert ) {
		var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
		var callback = function (buffer) {
			window.clearTimeout(timeout);
			var mbs = new MultiBufferStream();
			var file = new ISOFile(mbs);
			mbs.insertBuffer(buffer);
			file.parse();
			assert.ok(true, "file "+conformanceFiles[fileIndex]+" parsing");
			QUnit.start();
		};
		getFile(conformanceFiles[fileIndex], callback);
	});
}

for (var i = 0; i < conformanceFiles.length; i++) {
	makeBoxParsingTest(i);
}
