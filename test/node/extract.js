var fs = require('fs');
var MP4Box = require('mp4box');

mp4boxModule.Log.setLogLevel(mp4boxModule.Log.debug);

if (process.argv.length > 3) {
	var mp4boxfile = MP4Box.createFile();
	mp4boxfile.onReady = function(info) {		
		var found = false;
		for (var i = 0; i < info.tracks.length; i++) {
			if (info.tracks[i].id == process.argv[3]) {
				mp4boxfile.setExtractionOptions(info.tracks[i].id);  
				found = true;
			}
		}
		if (found === false) {
			console.log("Track id "+process.argv[3]+" not found in file "+process.argv[2]);
		}
		mp4boxfile.start();
	};
	mp4boxfile.onSamples = function (id, user, samples) {
    	console.log("Received "+samples.length+" samples on track "+id+(user ? " for object "+user: ""));
    	for (var i = 0; i < samples.length; i++) {
    		console.log("Writing sample #"+i+" of length "+samples[i].data.byteLength);
    		fs.writeFileSync('track_'+id+"-sample"+i+'.raw', toBuffer(samples[i].data));
    		if (samples[i].description.type === "metx" || samples[i].description.type === "stpp") {
	    		var sampleParser = new mp4boxModule.XMLSubtitlein4Parser();
				var xmlSubSample = sampleParser.parseSample(samples[i]); 
				if (xmlSubSample.documentString) {
					fs.writeFileSync('track_'+id+"-sample"+i+'-main.xml', xmlSubSample.documentString);
				}
				for (var j = 1; j < xmlSubSample.resources.length; j++) {
		    		fs.writeFileSync('track_'+id+"-sample"+i+'-subsample'+j+'.raw', toBuffer(xmlSubSample.resources[j]));
				}
			}
    	}		
	}
	var arrayBuffer = new Uint8Array(fs.readFileSync(process.argv[2])).buffer;
	arrayBuffer.fileStart = 0;
	mp4boxfile.appendBuffer(arrayBuffer);	
} else {
	console.log("usage: node extract.js <file> <trackid>");
}

function toBuffer(ab) {
    var buffer = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
    }
    return buffer;
}
