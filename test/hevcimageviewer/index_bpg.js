// Setting the level of logs (error, warning, info, debug)
Log.setLogLevel(Log.d);

// The main object processing the mp4 files
var mp4boxfile;

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

	mp4boxfile.onMoovStart = function() {
		console.log("Starting to receive File Information");
	}

	mp4boxfile.onReady = function(info) {
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
				mp4boxfile.setExtractionOptions(info.tracks[i].id, null, { nbSamples: 1 });
				isHEVC = true;
				progressLabel.show();
			}
		}
		mp4boxfile.start();
		if (!isHEVC)
			throw("Not an HEVC movie file.");
	}

	mp4boxfile.onError = function(e) {
 		console.log("Received Error Message "+e);
	}

	mp4boxfile.onSamples = function (id, user, samples) {	

		if (!stopProcess) {
			console.log("Received "+samples.length+" samples on track "+id+" for object "+user);
			for (var i = 0; i < samples.length; i++) {
				var sample = samples[i];
				// Check if it is HEVC
				if (sample.description.type === "hvc1") {
					if (sample.is_sync === true) {
						// Send MP4 data to build a BPG	
						var hevcFrame = HEVCFrame.createFrameFromSample(sample);
						var bpg = new BPG();
						bpg.readFromHEVC(hevcFrame, sample.size + sample.description.hvcC.size, sample.dts/sample.timescale);
						showBPG(bpg, 1);
					}
				}
				else {
					throw("Not an HVC1 movie file.");
				}
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
		if (downloader) {
			downloader.stop();
		}
		mp4boxfile.unsetExtractionOptions(1);
	}
	else {
		stopButton.show();
		stopButton.attr("onclick", "toggleStopExtraction(true);");
		stopButton.css("opacity", "1.0");
		stopButton.css("cursor", "pointer");
		stopProcess = false;
	}
}

// HTTP URL video
function loadVideoFileHttpUrl(url) {
	var timeline = document.getElementById("timeline");
	timeline.innerHTML = "";
	progressBar.progressbar({ value: 0 });

	if (url) {
		mp4boxfile = MP4Box.createFile(false);
		setMP4Box();

		downloader = new Downloader();

		downloader.setCallback(
			function (response, end, error) { 
				if (response) {
					var nextStart = mp4boxfile.appendBuffer(response);
					downloader.setChunkStart(nextStart); 
				}
				if (end) {
					mp4boxfile.flush();
				}
				if (error) {
					console.log("Error downloading.");
				}
			}
		);

		downloader.setUrl(url);
		downloader.setInterval(1000);
		downloader.setChunkSize(1000000);
		downloader.start();
	}
	else
		throw ("URL not informed.");
}

function readAndShowBPG(buffer) {
	console.log("Start reading the BPG");
    var bpg = new BPG();
    bpg.read(buffer, 0);
    showBPG(bpg, 0); 	
}

// HTTP URL video
function loadImageFileHttpUrl(url) {
	if (url) {
		downloader = new Downloader();

		downloader.setCallback(
			function (response, end, error) { 
				if (end && response) {
					readAndShowBPG(response);
				}
				if (error) {
					console.log("Error downloading.");
				}
			}
		);

		downloader.setUrl(url);
		downloader.setInterval(1000);
		downloader.setChunkSize(Number.POSITIVE_INFINITY);
		downloader.start();
	}
	else
		throw ("URL not informed.");
}

// Image file upload
function loadImageFileUpload(file) {
	var fileReader = new FileReader();
	fileReader.onload = function(e) {
							readAndShowBPG(fileReader.result);
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
	
	mp4boxfile = MP4Box.createFile(false);
	setMP4Box();

   	var onparsedbuffer = function(mp4boxfile, buffer) {
    	console.log("Appending buffer with offset "+offset);
		buffer.fileStart = offset;
		mp4boxfile.appendBuffer(buffer);	
	}

	var onBlockRead = function(evt) {
        if (evt.target.error == null) {
            onparsedbuffer(mp4boxfile, evt.target.result); // callback for handling read chunk
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
			throw("Not a valid file.");

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
		throw("Not a valid HTTP URL.");
}

// Save file from an ArrayBuffer
function saveData(arrayBuffer, fileName) {
    var blob = new Blob([arrayBuffer]);
    var URL = window.URL;
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
        throw("Can't create object URL.");
    }
}

function setUrl(url) {
	document.getElementById('urlInput').value = url;
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

// List representing the images buffered for decoding
var imagesBuffer = [];

// Show the BPG in a canvas using the BPGDecoder
function showBPG(bpg, isThumbnail) {
    var dts;

    console.log("Showing BPG");

    if (bpg.dts !== undefined) {
        dts = bpg.dts;
    }

    var blob = new Blob([bpg.toBitStream().dataView.buffer]);
    var URL = window.URL;
    if (URL && URL.createObjectURL) {
        var url = URL.createObjectURL(blob);
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        var img = new BPGDecoder(ctx);

        // Insert the image at the end of the line
        if (isThumbnail) {
            imagesBuffer.push(dts);
        }

        img.onload = function() {
            canvas.height = this.imageData.height;
            canvas.width = this.imageData.width;
            ctx.putImageData(this.imageData, 0, 0);

            // Thumbnails in timeline 
            if (isThumbnail) {
			    var thumbnail;
				var timeline = document.getElementById("timeline");

                // Remove first element of the line and check if it is the same decoded
                for (var imageBufferedDTS = imagesBuffer.shift();
                dts !== imageBufferedDTS;
                imageBufferedDTS = imagesBuffer.shift()) {
                    thumbnail = buildThumbnail(bpg, this.imageData, imageBufferedDTS);
                    timeline.appendChild(thumbnail);
                }

                thumbnail = buildThumbnail(bpg, this.imageData, dts, canvas);
                timeline.appendChild(thumbnail);
            }
            // Image
            else {
                buildImageDiv(bpg, this.imageData, canvas);
            }
        };

        img.load(url);
    }
    else {
        throw("Can't create object URL.");
    }
}

function buildThumbnail(bpg, imageData, dts, canvas) {
    // Update the progress bar
    timeProgress = dts;
    progressBar.progressbar({ value: Math.ceil(100*timeProgress/totalDuration) });

    // Container
    var thumbnail = document.createElement("div");
    thumbnail.style.display = "inline-block";
    thumbnail.style.position = "relative"

    // Timestamp
    var timestamp = document.createElement("span");
    timestamp.innerHTML = Log.getDurationString(dts);
    timestamp.className = "timestamp";
    thumbnail.appendChild(timestamp);
    
    var canvasTimeline = document.createElement("canvas");
    var sF = 100.0 / imageData.height;
    canvasTimeline.className = "thumbnail";
    canvasTimeline.height = 100;
    canvasTimeline.width = imageData.width * sF;
    canvasTimeline.id = "canvasThumbnail" + dts;
    var ctxTimeline = canvasTimeline.getContext("2d");
    if (canvas) { 
        ctxTimeline.scale(sF, sF);
        ctxTimeline.drawImage(canvas, 0, 0);
        canvasTimeline.addEventListener("click", function() {buildImageDiv(bpg, canvas);}, false);
        canvasTimeline.addEventListener("mouseover", function() {$(this).addClass("selected-thumbnail");}, false);
        canvasTimeline.addEventListener("mouseout", function() {$(this).removeClass("selected-thumbnail");}, false);
    } else {
        ctxTimeline.font = "10px Arial";
        ctxTimeline.textAlign = "center";
        ctxTimeline.textBaseline = "middle";
        ctxTimeline.fillStyle = "red";
        ctxTimeline.fillText("Could not decode image", (canvasTimeline.width / 2), (canvasTimeline.height / 2));
    }
    thumbnail.appendChild(canvasTimeline);

    return thumbnail;
}

function buildImageDiv(bpg, imageData, canvas) {

    // Container
    var image = document.getElementById("image");

    // Buttons
    var downloadButton = document.createElement("button");
    downloadButton.style.cssText = "position: absolute; bottom: 0px; left: 0px;"
    downloadButton.innerHTML = "<img src='download_icon.png'>";
    downloadButton.addEventListener("click", function() {saveData(bpg.toBitStream().dataView.buffer, "image.bpg");}, false);

    var closeButton = document.createElement("button");
    closeButton.style.cssText = "position: absolute; top: 0px; right: 0px;"
    closeButton.innerHTML = "<img src='close_icon.png'>";
    closeButton.addEventListener("click", function() {image.innerHTML = ""; $("#popup").hide();}, false);

    // Canvas configuration
    var canvasImage = document.createElement("canvas");
    canvasImage.height = imageData.height;
    canvasImage.width = imageData.width;
    var ctxImage = canvasImage.getContext("2d");
    ctxImage.drawImage(canvas, 0, 0);

    // Inclusions
    image.appendChild(downloadButton);
    image.appendChild(closeButton);
    image.appendChild(canvasImage);

    // Popup
    $("#popup").show();
}