/* MP4box/BPG 
 * 2015 - Wesley Marques Dias
 * Index
 */

var hevcURL = "http://download.tsi.telecom-paristech.fr/gpac/dataset/dash/uhd/mux_sources/hevcds_720p30_2M.mp4";

/* Setting the level of logs (error, warning, info, debug) */
Log.setLogLevel(Log.d);

/* The main object processing the mp4 files */
var mp4box;

/* Object responsible for file downloading */
var downloader;

/* Flag for stop downloading */
var done = false;

function load(url) {

	mp4box = new MP4Box();

	mp4box.onMoovStart = function () {
		Log.i("Application", "Starting to parse movie information");
	}

	mp4box.onReady = function (info) {
		Log.i("Application", "Movie information received");
		movieInfo = info;
		mp4box.setExtractionOptions(2, null, { nbSamples: 1 });
	}

	mp4box.onSamples = function (id, user, samples) {	
		var texttrack = user;
		Log.i("Track #"+id,"Received "+samples.length+" new sample(s)");
		for (var j = 0; j < samples.length; j++) {
			var sample = samples[j];
			if (sample.description.type === "hvc1") {
				console.log(sample.description.hvcC);
				console.log(sample.data);
				// Send MP4 data to build a BPG
				if (!done) {			
					extractBPG(sample);
					var bpg = extractBPG(sample);
					bpg.show();
					done = true;
				}
			}
		}
		downloader.stop();
		mp4box.unsetExtractionOptions(1);
	}	

    downloader = new Downloader();
	downloader.setCallback(
		function (response, end, error) { 
			if (response) {
				var nextStart = mp4box.appendBuffer(response);
				downloader.setChunkStart(nextStart); 
			}
			if (end) {
				mp4box.flush();
			}
			if (error) {
				console.log("error downloading");
			}
		}
	);

	downloader.setUrl(url);
	downloader.setInterval(1000);
	downloader.setChunkSize(1000000);
	downloader.start();
}

function saveBuffer(buffer, name) {     
    if (saveChecked.checked) {
        var d = new DataStream(buffer);
        d.save(name);
    }
}

function saveData(arrayBuffer, fileName) {
    var blob = new Blob([arrayBuffer]);
    var URL = (window.webkitURL || window.URL);
    if (URL && URL.createObjectURL) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } 
    else {
        throw("index_bpg.saveData(): Can't create object URL.");
    }
}

function parseFile(file) {
    var fileSize   = file.size;
    var offset     = 0;
    var self       = this; // we need a reference to the current object
    var readBlock  = null;
 	var startDate  = new Date();
	var chunkSize  = 1000000;
	mp4box 	   = new MP4Box();

	mp4box.onError = function(e) { 
		console.log("mp4box failed to parse data."); 
	};

 	mp4box.onReady = function (info) {
		Log.i("Application", "Movie information received");
		movieInfo = info;
		mp4box.setExtractionOptions(1, null, { nbSamples: 1 });
	}
	mp4box.onSamples = function (id, user, samples) {	
		var texttrack = user;
		Log.i("Track #"+id,"Received "+samples.length+" new sample(s)");
		for (var j = 0; j < samples.length; j++) {
			var sample = samples[j];
			if (sample.description.type === "hvc1") {
				console.log(sample.description.hvcC);
				console.log(sample.data);
				// Send MP4 data to build a BPG
				if (!done) {			
					var hevcFrame = new HEVCFrame();
					var bpg = extractBPG(sample);
					bpg.show();
					done = true;
				}
			}
		}
		mp4box.unsetExtractionOptions(1);
	}	

   var onparsedbuffer = function(mp4box, buffer) {
    	console.log("Appending buffer with offset "+offset);
		buffer.fileStart = offset;
    	mp4box.appendBuffer(buffer);	
	}

	var onBlockRead = function(evt) {
        if (evt.target.error == null) {
            onparsedbuffer(mp4box, evt.target.result); // callback for handling read chunk
            offset += evt.target.result.byteLength;
        } else {
            console.log("Read error: " + evt.target.error);
            return;
        }
        if (offset >= fileSize) {
        	var endRead = new Date();
            console.log("Done reading file ("+fileSize+ " bytes) in "+(endRead - startDate)+" ms");
            return;
        }

        readBlock(offset, chunkSize, file);
    }

    readBlock = function(_offset, length, _file) {
        var r = new FileReader();
        var blob = _file.slice(_offset, length + _offset);
        r.onload = onBlockRead;
        r.readAsArrayBuffer(blob);
    }

    readBlock(offset, chunkSize, file);
}

function onFileEvent(e) {
	var file = document.getElementById('fileinput').files[0];
	parseFile(file);
}

// Extract a BPG from the HEVCFrame using the NAL Units
function extractBPG(sample) {
	var mp4NALUSHead = sample.description.hvcC.nalu_arrays;
	var mp4NALUSData = sample.data;
	var hevcFrame = new HEVCFrame();
	hevcFrame.width = sample.description.width;
	hevcFrame.height = sample.description.height;
	
	for (var i = 0; i < mp4NALUSHead.length; i++) {
		// Sequence Parameter Set
		if (mp4NALUSHead[i].nalu_type === 33)
			hevcFrame.readSPS(mp4NALUSHead[i][0].data);
		// Picture Parameter Set
		if (mp4NALUSHead[i].nalu_type === 34)
			hevcFrame.PPS = mp4NALUSHead[i][0].data;
	}
	// Video Coding Layer and Supplemental Enhancement Information
	// Read mp4NALUSData removing the Starting Length from each NALU and inserting a Starting Code
	hevcFrame.readData(mp4NALUSData, sample.description.hvcC.lengthSizeMinusOne + 1);

	// Create BPG
	var bpg = hevcFrame.toBPG(sample.size + sample.description.hvcC.size);

	return bpg;
}

window.onload = function() {
	$("#tabs");
}