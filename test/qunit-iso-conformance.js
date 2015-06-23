function makeBoxParsingTest(fileIndex) {
	QUnit.asyncTest(conformanceFiles[fileIndex], function( assert ) {
		var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
		var callback = function (buffer) {
			window.clearTimeout(timeout);
			var file = new ISOFile(new MP4BoxStream(buffer, MP4BoxStream.BIG_ENDIAN));
			file.parse();
			assert.ok(true, "file"+conformanceFiles[fileIndex]+"parsed");
			QUnit.start();
		};
		getFile(conformanceFiles[fileIndex], callback);
	});
}

for (var i = 0; i < conformanceFiles.length; i++) {
	makeBoxParsingTest(i);
}
