/* MP4box/BPG 
 * 2015 - Wesley Marques Dias
 * Index
 */

// Setting the level of logs (error, warning, info, debug)
Log.setLogLevel(Log.d);

// The main object processing the mp4 files
var mp4box;

// Object responsible for file downloading
var downloader;

// Progress bar information
var progressBar;
var progressLabel;
var timeProgress;
var totalDuration;

// Setup MP4Box
function setMP4Box() {

	mp4box.onMoovStart = function() {
		console.log("Starting to receive File Information");
	}

	mp4box.onReady = function(info) {
		var isHEVC = false;
		console.log("Received File Information");
		// Extract only for video tracks
		for (var i = 0; i < info.tracks.length; i++) {
			// Video track
			if (info.tracks[i].codec.substring(0,4) === "hvc1") {
				totalDuration = info.tracks[i].duration;
				timeProgress = 0;
				// 1 call for each sample
				mp4box.setExtractionOptions(info.tracks[i].id, null, { nbSamples: 1 });
				isHEVC = true;
				progressLabel.show();
			}
		}
		if (!isHEVC)
			throw("index_bpg.setMP4Box(): Not a HEVC movie file.");
	}

	mp4box.onError = function(e) {
 		console.log("Received Error Message "+e);
	}

	mp4box.onSamples = function (id, user, samples) {	
		console.log("Received "+samples.length+" samples on track "+id+" for object "+user);

		for (var i = 0; i < samples.length; i++) {
			var sample = samples[i];
			// Check if it is HEVC
			if (sample.description.type === "hvc1") {
				if (sample.is_rap === true) {
					// Send MP4 data to build a BPG	
					var bpg = extractBPG(sample);
					bpg.show(1);
				}
			}
			else
				throw("index_bpg.setMP4Box(): Not a expected HEVC movie file.");
		}
	}	
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
	var bpg = hevcFrame.toBPG(sample.size + sample.description.hvcC.size, sample.dts);

	return bpg;
}

// HTTP URL input
function loadFromHttpUrl() {
	var url = document.getElementById('urlInput').value;
	var timeline = document.getElementById("timeline");
	timeline.innerHTML = "";

	if (url) {
		mp4box = new MP4Box();
		setMP4Box();

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
					console.log("index_bpg.loadFromHttpUrl(): Error downloading.");
				}
			}
		);

		downloader.setUrl(url);
		downloader.setInterval(1000);
		downloader.setChunkSize(1000000);
		downloader.start();
	}
	else
		throw ("index_bpg.loadFromHttpUrl(): URL not informed.");
}


// Image file upload
function loadImageFile(file) {
	var fileReader = new FileReader();

	fileReader.onload =
		function(e) {
			var arrayBufferRead = fileReader.result;
			console.log("Start reading the BPG");
            var bitStreamRead = new BitStream(arrayBufferRead);
		    var bpg = new BPG(bitStreamRead);
		    bpg.show(0); 
		};

	fileReader.readAsArrayBuffer(file);
}

// Video file upload
function loadVideoFile(file) {
    var fileSize   = file.size;
    var offset     = 0;
    var self       = this; // we need a reference to the current object
    var readBlock  = null;
 	var startDate  = new Date();
	var chunkSize  = 1000000;	
	
	mp4box = new MP4Box();
	setMP4Box();

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

// File upload handler
function loadFromFile() {
	
	var file = document.getElementById('fileInput').files[0];
	
	// HEVC(MP4)
	if (file.type === "video/mp4") {
		var timeline = document.getElementById("timeline");
		timeline.innerHTML = "";
		loadVideoFile(file);
	}
	// BPG
	if (file.name.split('.').pop() === "bpg")
		loadImageFile(file);
}

// Save file from an ArrayBuffer
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

// UI adjustments
window.onload = function() {
	$("#tabs").tabs();

	progressLabel = $("#progressLabel");
	progressLabel.hide();
	progressBar = $("#progressbar");
	progressBar.progressbar({ 
		value: 0,
		change: function() {
           progressLabel.text(progressBar.progressbar("value") + "%");
        },
        complete: function() {
           progressLabel.text("Loading Completed!");
        }
    });

	$(window).scroll(function () { 
		if ($(this).scrollTop() > 283)
			progressBar.addClass("fixed-menu"); 
		else 
			progressBar.removeClass("fixed-menu"); 
		
	});

	$("#popup").hide();
}