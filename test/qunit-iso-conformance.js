function makeBoxParsingTest(fileIndex) {
	QUnit.asyncTest(conformanceFiles[fileIndex], function( assert ) {
		var timeout = window.setTimeout(function() { assert.ok(false, "Timeout"); QUnit.start(); }, TIMEOUT_MS);
		var callback = function (buffer) {
			window.clearTimeout(timeout);
			var mbs = new MultiBufferStream();
			var file = new ISOFile(mbs);
			mbs.insertBuffer(buffer);
			file.parse();
			file.write(new DataStream(new ArrayBuffer(), 0, DataStream.BIG_ENDIAN));
			assert.ok(true, "file "+conformanceFiles[fileIndex]+" parsing");
			QUnit.start();
		};
		getFile(conformanceFiles[fileIndex], callback);
	});
}

var conformanceFiles;
var xhr = new XMLHttpRequest();
xhr.open('GET', 'iso-conformance-files.js', false);
xhr.send();
if(xhr.status == 200 || xhr.status == 0 ) {
  	conformanceFiles = JSON.parse(xhr.responseText);

	for (var i = 0; i < conformanceFiles.length; i++) {
		makeBoxParsingTest(i);
	}
}

