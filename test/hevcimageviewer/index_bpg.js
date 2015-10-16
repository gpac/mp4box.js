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
var progressText;
var timeProgress;
var totalDuration;

// Stop the extraction process
var stopProcess = false;
var stopButton;

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
			var codec = info.tracks[i].codec.substring(0,4);
			if (codec === "hvc1" || codec === "hev1") {
				totalDuration = info.tracks[i].duration/info.tracks[i].timescale;
				timeProgress = 0;
				// 1 call for each sample
				mp4box.setExtractionOptions(info.tracks[i].id, null, { nbSamples: 1 });
				isHEVC = true;
				progressLabel.show();
			}
		}
		mp4box.start();
		if (!isHEVC)
			throw("index_bpg.setMP4Box(): Not a HEVC movie file.");
	}

	mp4box.onError = function(e) {
 		console.log("Received Error Message "+e);
	}

	mp4box.onSamples = function (id, user, samples) {	

		if (!stopProcess) {
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
}

function toggleStopExtraction(stop) {
	if (stop) {
		stopButton.prop("onclick", null);
		stopButton.css("opacity", "0.4");
		stopButton.css("cursor", "default");
		stopProcess = true;
		if (downloader)
			downloader.stop();
		mp4box.unsetExtractionOptions(1);
	}
	else {
		stopButton.show();
		stopButton.attr("onclick", "toggleStopExtraction(true);");
		stopButton.css("opacity", "1.0");
		stopButton.css("cursor", "pointer");
		stopProcess = false;
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
	var bpg = hevcFrame.toBPG(sample.size + sample.description.hvcC.size, sample.dts/sample.timescale);

	return bpg;
}

// HTTP URL video
function loadVideoFileHttpUrl(url) {
	var timeline = document.getElementById("timeline");
	timeline.innerHTML = "";
	progressBar.progressbar({ value: 0 });

	if (url) {
		mp4box = new MP4Box(false);
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
					console.log("index_bpg.loadVideoFileHttpUrl(): Error downloading.");
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

// HTTP URL video
function loadImageFileHttpUrl(url) {
	url = document.getElementById('urlInput').value;

	if (url) {
		downloader = new Downloader();

		downloader.setCallback(
			function (response, end, error) { 
				if (end && response) {
					var arrayBufferRead = response;
					console.log("Start reading the BPG");
		            var bitStreamRead = new BitStream(arrayBufferRead);
				    var bpg = new BPG(bitStreamRead);
				    bpg.show(0); 
				}
				if (error) {
					console.log("index_bpg.loadImageFromHttpUrl(): Error downloading.");
				}
			}
		);

		downloader.setUrl(url);
		downloader.setInterval(1000);
		downloader.setChunkSize(Number.POSITIVE_INFINITY);
		downloader.start();
	}
	else
		throw ("index_bpg.loadFromHttpUrl(): URL not informed.");
}


// Image file upload
function loadImageFileUpload(file) {
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
function loadVideoFileUpload(file) {
    var fileSize   = file.size;
    var offset     = 0;
    var self       = this; // we need a reference to the current object
    var readBlock  = null;
 	var startDate  = new Date();
	var chunkSize  = 1000000;	

	var timeline = document.getElementById("timeline");
	timeline.innerHTML = "";
	progressBar.progressbar({ value: 0 });
	
	mp4box = new MP4Box(false);
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
	toggleStopExtraction(false);
	
	// HEVC(MP4)
	if (file.type === "video/mp4")
		loadVideoFileUpload(file);
	// BPG
	else
		if (file.name.split('.').pop() === "bpg")
			loadImageFileUpload(file);
		else
			throw("index_bpg.loadFromFile(): Not a valid file.");

	document.getElementById('fileInput').value = "";
}

// HTTP URL input handler
function loadFromHttpUrl() {
	
	var url = document.getElementById('urlInput').value;
	var validUrl = true;
	toggleStopExtraction(false);

	if (url.length > 3) {
		var extension = url.substring(url.length - 3);
		// HEVC(MP4)
		if (extension === "mp4")
			loadVideoFileHttpUrl(url);
		// BPG
		else
			if (extension === "bpg")
				loadImageFileHttpUrl(url);		
			else
				validUrl = false;
	}
	else
		validUrl = false;

	if (!validUrl)
		throw("index_bpg.loadFromHttpUrl(): Not a valid HTTP URL.");
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
	progressText = $("#progressText");
	progressLabel.hide();
	stopButton = $("#stopButton");
	progressBar = $("#progressbar");
	progressBar.progressbar({ 
		value: 0,
		change: function() {
           	progressText.text(progressBar.progressbar("value") + "%");
        },
        complete: function() {
        	$("#stopButton").hide();
           	progressText.text("Loading Completed!");
        }
    });

	$(window).scroll(function () { 
		if ($(this).scrollTop() > 283)
			progressBar.addClass("fixed-menu");
		else 
			progressBar.removeClass("fixed-menu");
	});

	$("#popup").hide();

	var urlSelector = document.getElementById('urlSelector');
	urlSelector.selectedIndex = -1;

	buildUrlList(urlSelector);
}

function setUrl(url) {
	document.getElementById('urlInput').value = url;
}
