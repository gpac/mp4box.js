/* Setting the level of logs (error, warning, info, debug) */
Log.setLogLevel(Log.info);

/* The main object processing the mp4 files */
var mp4boxfile;
/* Metadata extracted from the mp4 file */
var movieInfo;

/* object responsible for file downloading */
var downloader = new Downloader();
downloader.setDownloadTimeoutCallback = setDownloadTimeout;

/* the HTML5 video element */
var video;
var overlayTracks;

var autoplay = false;

var startButton, loadButton, initButton, initAllButton, playButton;
var urlInput, chunkTimeoutInput, chunkSizeInput;
var infoDiv, dlTimeoutDiv, htm5MediaDiv;
var chunkTimeoutLabel, chunkSizeLabel, segmentSizeLabel, extractionSizeLabel;
var urlSelector;
var saveChecked;
var progressbar;
var progresslabel;

window.onload = function () {
	video = document.getElementById('v');
	overlayTracks = document.getElementById('overlayTracks');
	playButton = document.getElementById("playButton");
	startButton = document.getElementById("startButton");
	loadButton = document.getElementById("loadButton");
	initButton = document.getElementById("initButton");
	initAllButton = document.getElementById("initAllButton");
	urlInput = document.getElementById('url');
	chunkTimeoutInput = document.getElementById('chunk_speed_range');
	chunkSizeInput = document.getElementById("chunk_size_range");
	infoDiv = document.getElementById('infoDiv');
	html5MediaDiv = document.getElementById('html5MediaDiv');
	dlTimeoutDiv = document.getElementById('dlTimeout');
	chunkTimeoutLabel = document.querySelector('#chunk_speed_range_out');	
	chunkSizeLabel = document.querySelector('#chunk_size_range_out');
	segmentSizeLabel = document.querySelector('#segment_size_range_out');
	extractionSizeLabel = document.querySelector('#extraction_size_range_out');
	playbackRateLabel = document.querySelector('#playback_rate_range_out');
	chunkDownloadBitRate = document.querySelector('#chunk_dl_rate');
	urlSelector = document.getElementById('urlSelector');
	urlSelector.selectedIndex = -1;
	saveChecked = document.getElementById("saveChecked");

	$("#tabs").tabs();
	progressbar = $('#progressbar');
	progresslabel = $('#progress-label');
	progressbar.progressbar({ 
		value: 0, 
		change: function() {
           progresslabel.text( 
              "Download in progress: " + progressbar.progressbar( "value" ) + "%" );
        },
        complete: function() {
           progresslabel.text( "Download Completed!" );
        }
    });

	buildUrlList(urlSelector);

	video.addEventListener("seeking", onSeeking);
	video.addEventListener("error", function (e) {
		Log.error("Media Element error", e);
	});
	video.playing = false;
	video.addEventListener("playing", function(e) { 
		console.log("Playing event,");
		video.playing = true;
		if (video.onPlayCue) {
			processInbandCue.call(video.onPlayCue);
			video.onPlayCue = null;
		}
	});
/*	video.addEventListener("suspend", function(e) { 
		console.log("Suspend event,");
		video.playing = false;
	});
	video.addEventListener("stalled", function(e) { 
		console.log("Stalled event,");
		video.playing = false;
	});
	video.addEventListener("waiting", function(e) { 
		console.log("Waiting event,");
		video.playing = false;
	});
*/	
	if (video.videoTracks) video.videoTracks.onchange = updateHtml5TrackInfo;
	if (video.audioTracks) video.audioTracks.onchange = updateHtml5TrackInfo;
	if (video.textTracks) video.textTracks.onchange = updateHtml5TrackInfo;
	reset();	

	/* Loading Track Viewers */
	var s = document.createElement("script");
	s.src = "trackviewers/fancyLyrics/viewer.js";
	s.async = false;
	document.head.appendChild(s);
	s = document.createElement("script");
	s.src = "trackviewers/musicbeats/viewer.js";
	s.async = false;
	document.head.appendChild(s);
	s = document.createElement("script");
	s.src = "trackviewers/gps/altitude.js";
	s.async = false;
	document.head.appendChild(s);
	s = document.createElement("script");
	s.src = "trackviewers/gps/position.js";
	s.async = false;
	document.head.appendChild(s);
}

/* GUI-related callback functions */
function setUrl(url) {
	reset();
	urlInput.value = url;
	if (urlInput.value !== "") {
		loadButton.disabled = false;
		playButton.disabled = false;
	} else {
		loadButton.disabled = true;
		playButton.disabled = false;
	}
}

function toggleDownloadMode(event) {
	var checkedBox = event.target;
	if (checkedBox.checked) {
		downloader.setRealTime(true);
	} else {
		downloader.setRealTime(false);
	}
}

function setDownloadTimeout(value) {
	var b;
	chunkTimeoutLabel.value = value;
	chunkTimeoutInput.value = value;
	downloader.setInterval(parseInt(value));
	b = Math.floor(parseInt(chunkSizeLabel.value)*8/parseInt(value));
	chunkDownloadBitRate.innerHTML = b;
}

function setDownloadChunkSize(value) {
	chunkSizeLabel.value = value;
	downloader.setChunkSize(parseInt(value));
	chunkDownloadBitRate.innerHTML = Math.floor(parseInt(chunkSizeLabel.value)*8/parseInt(chunkTimeoutInput.value));
}

function setSegmentSize(value) {
	segmentSizeLabel.value = value;
}

function setExtractionSize(value) {
	extractionSizeLabel.value = value;
}

function setPlaybackRate(value) {
	playbackRateLabel.value = value;
	video.playbackRate = parseInt(value);
}

/* Functions to generate the tables displaying file information */	
function resetDisplay() {
	infoDiv.innerHTML = '';
	html5MediaDiv.innerHTML = '';
	overlayTracks.innerHTML = '';
	//video.poster = '';
	//video.playing = false;
}


/* main functions, MSE-related */
function resetMediaSource() {
	if (video.ms) return;
	
	var mediaSource;
	mediaSource = new MediaSource();
	mediaSource.video = video;
	video.ms = mediaSource;
	mediaSource.addEventListener("sourceopen", onSourceOpen);
	mediaSource.addEventListener("sourceclose", onSourceClose);
	video.src = window.URL.createObjectURL(mediaSource);
	/* TODO: cannot remove Text tracks! Turning them off for now*/
	for (var i = 0; i < video.textTracks.length; i++) {
		var tt = video.textTracks[i];
		tt.mode = "disabled";
	}
}

function onSourceClose(e) {
	var ms = e.target;
	if (ms.video.error) {
		Log.error("MSE", "Source closed, video error: "+ ms.video.error.code);		
	} else {
		Log.info("MSE", "Source closed, no error");
	}
}

function onSourceOpen(e) {
	var ms = e.target;
	Log.info("MSE", "Source opened");
	Log.debug("MSE", ms);
	urlSelector.disabled = false;
}

function updateBufferedString(sb, string) {
	var rangeString;
	if (sb.ms.readyState === "open") {
		rangeString = Log.printRanges(sb.buffered);
		Log.info("MSE - SourceBuffer #"+sb.id, string+", updating: "+sb.updating+", currentTime: "+Log.getDurationString(video.currentTime, 1)+", buffered: "+rangeString+", pending: "+sb.pendingAppends.length);
		if (sb.bufferTd === undefined) {
			sb.bufferTd = document.getElementById("buffer"+sb.id);
		}
		sb.bufferTd.textContent = rangeString;
	}
}

function onInitAppended(e) {
	var sb = e.target;
	if (sb.ms.readyState === "open") {
		updateBufferedString(sb, "Init segment append ended");
		sb.sampleNum = 0;
		sb.removeEventListener('updateend', onInitAppended);
		sb.addEventListener('updateend', onUpdateEnd.bind(sb, true, true));
		/* In case there are already pending buffers we call onUpdateEnd to start appending them*/
		onUpdateEnd.call(sb, false, true);
		sb.ms.pendingInits--;
		if (autoplay && sb.ms.pendingInits === 0) {
			start();
		}
	}
}

function onUpdateEnd(isNotInit, isEndOfAppend) {
	if (isEndOfAppend === true) {
		if (isNotInit === true) {
			updateBufferedString(this, "Update ended");
		}
		if (this.sampleNum) {
			mp4boxfile.releaseUsedSamples(this.id, this.sampleNum);
			delete this.sampleNum;
		}
		if (this.is_last) {
			this.ms.endOfStream();
		}
	}
	if (this.ms.readyState === "open" && this.updating === false && this.pendingAppends.length > 0) {
		var obj = this.pendingAppends.shift();
		Log.info("MSE - SourceBuffer #"+this.id, "Appending new buffer, pending: "+this.pendingAppends.length);
		this.sampleNum = obj.sampleNum;
		this.is_last = obj.is_last;
		this.appendBuffer(obj.buffer);
	}
}

function addBuffer(video, mp4track) {
	var sb;
	var ms = video.ms;
	var track_id = mp4track.id;
	var codec = mp4track.codec;
	var mime = 'video/mp4; codecs=\"'+codec+'\"';
	var kind = mp4track.kind;
	var trackDefault;
	var trackDefaultSupport = (typeof TrackDefault !== "undefined");
	var html5TrackKind = "";
	if (codec == "wvtt") {
		if (!kind.schemeURI.startsWith("urn:gpac:")) {
			html5TrackKind = "subtitles";
		} else {
			html5TrackKind = "metadata";
		}
	} else {
		if (kind && kind.schemeURI === "urn:w3c:html5:kind") {
			html5TrackKind = kind.value || "";
		} 
	}
	if (trackDefaultSupport) {
		if (mp4track.type === "video" || mp4track.type === "audio") {
			trackDefault = new TrackDefault(mp4track.type, mp4track.language, mp4track.name, [ html5TrackKind ], track_id);
		} else {
			trackDefault = new TrackDefault("text", mp4track.language, mp4track.name, [ html5TrackKind ], track_id);
		}
	}
	if (MediaSource.isTypeSupported(mime)) {
		try {
			Log.info("MSE - SourceBuffer #"+track_id,"Creation with type '"+mime+"'");
			sb = ms.addSourceBuffer(mime);
			if (trackDefaultSupport) {
				sb.trackDefaults = new TrackDefaultList([trackDefault]);
			}
			sb.addEventListener("error", function(e) {
				Log.error("MSE SourceBuffer #"+track_id,e);
			});
			sb.ms = ms;
			sb.id = track_id;
			mp4boxfile.setSegmentOptions(track_id, sb, { nbSamples: parseInt(segmentSizeLabel.value) } );
			sb.pendingAppends = [];
		} catch (e) {
			Log.error("MSE - SourceBuffer #"+track_id,"Cannot create buffer with type '"+mime+"'" + e);
		}
	} else {
		Log.warn("MSE", "MIME type '"+mime+"' not supported for creation of a SourceBuffer for track id "+track_id);
		var i;
		var foundTextTrack = false;
		for (i = 0; i < video.textTracks.length; i++) {
			var track = video.textTracks[i];
			if (track.label === 'track_'+track_id) {
				track.mode = "showing";
				track.div.style.display = 'inline';
				foundTextTrack = true;
				break;
			}
		}
		if (!foundTextTrack) {
			var texttrack = video.addTextTrack(html5TrackKind, mp4track.name, mp4track.language);
			texttrack.id = track_id;
			texttrack.mode = "showing";
			mp4boxfile.setExtractionOptions(track_id, texttrack, { nbSamples: parseInt(extractionSizeLabel.value) });
			texttrack.codec = codec;
			texttrack.mime = codec.substring(codec.indexOf('.')+1);
			texttrack.mp4kind = mp4track.kind;
			texttrack.track_id = track_id;
			var div = document.createElement("div");
			div.id = "overlay_track_"+track_id;
			div.setAttribute("class", "overlay");
			overlayTracks.appendChild(div);
			texttrack.div = div;
			initTrackViewer(texttrack);
		}
	}
}

function removeBuffer(video, track_id) {
	var i;
	var sb;
	var ms = video.ms;
	Log.info("MSE - SourceBuffer #"+track_id,"Removing buffer");
	var foundSb = false;
	for (i = 0; i < ms.sourceBuffers.length; i++) {
		sb = ms.sourceBuffers[i];
		if (sb.id == track_id) {
			ms.removeSourceBuffer(sb);
			mp4boxfile.unsetSegmentOptions(track_id);
			foundSb = true;
			break;
		}
	}
	if (!foundSb) {
		for (i = 0; i < video.textTracks.length; i++) {
			var track = video.textTracks[i];
			if (track.label === 'track_'+track_id) {
				track.mode = "disabled";
				track.div.style.display = 'none';
				mp4boxfile.unsetExtractionOptions(track_id);
				break;
			}
		}
	}
	if (ms.sourceBuffers.length === 0) {
		return true;
	} else {
		return false;
	}
}

function addSourceBufferListener(info) {
	for (var i = 0; i < info.tracks.length; i++) {
		var track = info.tracks[i];
		var checkBox = document.getElementById("addTrack"+track.id);
		if (!checkBox) continue;
		checkBox.addEventListener("change", (function (t) { 
			return function (e) {
				var check = e.target;
				if (check.checked) { 
					addBuffer(video, t);
					initButton.disabled = false;
					initAllButton.disabled = true;
				} else {
					initButton.disabled = removeBuffer(video, t.id);
					initAllButton.disabled = initButton.disabled;
				}
			};
		})(track));
	}
}

function initializeAllSourceBuffers() {
	if (movieInfo) {
		var info = movieInfo;
		for (var i = 0; i < info.tracks.length; i++) {
			var track = info.tracks[i];
			addBuffer(video, track);
			var checkBox = document.getElementById("addTrack"+track.id);
			checkBox.checked = true;
		}
		initializeSourceBuffers();
	}
}

function initializeSourceBuffers() {
	var initSegs = mp4boxfile.initializeSegmentation();
	for (var i = 0; i < initSegs.length; i++) {
		var sb = initSegs[i].user;
		if (i === 0) {
			sb.ms.pendingInits = 0;
		}
		sb.addEventListener("updateend", onInitAppended);
		Log.info("MSE - SourceBuffer #"+sb.id,"Appending initialization data");
		sb.appendBuffer(initSegs[i].buffer);
		saveBuffer(initSegs[i].buffer, 'track-'+initSegs[i].id+'-init.mp4');
		sb.segmentIndex = 0;
		sb.ms.pendingInits++;
	}
	initAllButton.disabled = true;	
	initButton.disabled = true;
}

/* main player functions */
function reset() {
	stop();
	downloader.reset();
	startButton.disabled = true;	
	resetMediaSource();
	resetDisplay();
}

function resetCues() {
	for (var i = 0; i < video.textTracks.length; i++) {
		var texttrack = video.textTracks[i];
		while (texttrack.cues.length > 0) {
			texttrack.removeCue(texttrack.cues[0]);
		}
	}
} 

function initTrackViewer(track) {
	if (track.mime === "image/x3d+xml" && typeof(x3dom) === "undefined") {
		var link = document.createElement("link");
		link.type = "text/css";
		link.rel = "stylesheet";
		link.href= "trackviewers/x3d/x3dom.css";
		document.head.appendChild(link);
		var s = document.createElement("script");
		s.async = true;
		s.type="application/ecmascript";
		s.src = "trackviewers/x3d/x3dom.js";
		document.head.appendChild(s);
	} else if (track.mp4kind.schemeURI === "urn:gpac:kinds" && track.mp4kind.value === "gps") {
		track.oncuechange = setupGpsTrackPositionViewer(track, track.div);
	} else if (track.mp4kind.schemeURI === "urn:gpac:kinds" && track.mp4kind.value === "beats") {
		track.oncuechange = setupMusicBeatTrackViewer(track, track.div);
	} else if (track.mp4kind.schemeURI === "urn:gpac:kinds" && track.mp4kind.value === "lyrics") {
		track.oncuechange = setupFancySubtitleTrackViewer(track, track.div);
	}
}

function processInbandCue() {
	var content = "";
	if (video.playing === false) {
		video.onPlayCue = this;
		return;
	}
	if (this.is_sync & this.track.config) {
		content = this.track.config;
	} 
	content += this.text;
	console.log("Video Time:", video.currentTime, "Processing cue for track "+this.track.track_id+" with:", content);
	if (this.track.mime === "application/ecmascript") {
		var script = document.createElement("script");
		script.appendChild(document.createTextNode(content));
		this.track.div.appendChild(script);
		//this.track.div.innerHTML = "<script type='application/ecmascript'>"+content+"</script>";
	} else if (this.track.mime === "text/css") {
		this.track.div.innerHTML = "<style>"+content+"</style>";
	} else if (["image/svg+xml", "text/html", "image/x3d+xml"].indexOf(this.track.mime) > -1 ) {
		/* Presentable track */
		this.track.div.innerHTML = content;
		if (this.track.mime === "image/x3d+xml") {
			if (typeof(x3dom) !== "undefined") {
				x3dom.reload();
			}
		}
	} else {
		/* Pure metadata track */
	}
}


function load() {
	var ms = video.ms;
	if (ms.readyState !== "open") {
		return;
	}

	mp4boxfile = MP4Box.createFile();
	mp4boxfile.onMoovStart = function () {
		Log.info("Application", "Starting to parse movie information");
	}
	mp4boxfile.onReady = function (info) {
		Log.info("Application", "Movie information received");
		movieInfo = info;
		if (info.isFragmented) {
			ms.duration = info.fragment_duration/info.timescale;
		} else {
			ms.duration = info.duration/info.timescale;
		}
		displayMovieInfo(info, infoDiv);
		addSourceBufferListener(info);
		stop();
		if (autoplay) {
			initializeAllSourceBuffers();
		} else {
			initAllButton.disabled = false;
		}
	}
	mp4boxfile.onSidx = function(sidx) {
		console.log(sidx);
	}
	mp4boxfile.onItem = function(item) {
		var metaHandler = this.getMetaHandler();
		if (metaHandler.startsWith("mif1")) {
			var pitem = this.getPrimaryItem();
			console.log("Found primary item in MP4 of type "+item.content_type);
			if (pitem.id === item.id) {
				video.poster = window.URL.createObjectURL(new Blob([item.data.buffer]));
			}
		}
	}
	mp4boxfile.onSegment = function (id, user, buffer, sampleNum, is_last) {	
		var sb = user;
		saveBuffer(buffer, 'track-'+id+'-segment-'+sb.segmentIndex+'.m4s');
		sb.segmentIndex++;
		sb.pendingAppends.push({ id: id, buffer: buffer, sampleNum: sampleNum, is_last: is_last });
		Log.info("Application","Received new segment for track "+id+" up to sample #"+sampleNum+", segments pending append: "+sb.pendingAppends.length);
		onUpdateEnd.call(sb, true, false);
	}
	mp4boxfile.onSamples = function (id, user, samples) {
		var sampleParser;
		var cue;	
		var texttrack = user;
		Log.info("TextTrack #"+id,"Received "+samples.length+" new sample(s)");
		for (var j = 0; j < samples.length; j++) {
			var sample = samples[j];
			if (sample.description.type === "wvtt") {
				sampleParser = new VTTin4Parser();
				cues = sampleParser.parseSample(sample.data);
				for (var i = 0; i < cues.length; i++) {
					var cueIn4 = cues[i];
					cue = new VTTCue(sample.dts/sample.timescale, (sample.dts+sample.duration)/sample.timescale, (cueIn4.payl ? cueIn4.payl.text : ""));
					texttrack.addCue(cue);
				}
			} else if (sample.description.type === "metx" || sample.description.type === "stpp") {
				sampleParser = new XMLSubtitlein4Parser();
				var xmlSubSample = sampleParser.parseSample(sample); 
				console.log("Parsed XML sample at time "+Log.getDurationString(sample.dts,sample.timescale)+" :", xmlSubSample.document);
				cue = new VTTCue(sample.dts/sample.timescale, (sample.dts+sample.duration)/sample.timescale, xmlSubSample.documentString);
				texttrack.addCue(cue);
				cue.is_sync = sample.is_sync;
				cue.onenter = processInbandCue;
			} else if (sample.description.type === "mett" || sample.description.type === "sbtt" || sample.description.type === "stxt") {
				sampleParser = new Textin4Parser();
				if (sample.description.txtC && j===0) {
					if (sample.description.txtC.config) {
					} else {
						sample.description.txtC.config = sampleParser.parseConfig(sample.description.txtC.data); 
					}
					console.log("Parser Configuration: ", sample.description.txtC.config);
					texttrack.config = sample.description.txtC.config;
				}
				var textSample = sampleParser.parseSample(sample); 
				console.log("Parsed text sample at time "+Log.getDurationString(sample.dts,sample.timescale)+" :", textSample);
				cue = new VTTCue(sample.dts/sample.timescale, (sample.dts+sample.duration)/sample.timescale, textSample);
				texttrack.addCue(cue);
				cue.is_sync = sample.is_sync;
				cue.onenter = processInbandCue;
			}
		}
	}	
				
	loadButton.disabled = true;
	startButton.disabled = true;
	stopButton.disabled = false;

	downloader.setCallback(
		function (response, end, error) { 
			var nextStart = 0;
			if (response) {
				progressbar.progressbar({ value: Math.ceil(100*downloader.chunkStart/downloader.totalLength) });
				nextStart = mp4boxfile.appendBuffer(response, end);
			}
			if (end) {
				progressbar.progressbar({ value: 100 });
				mp4boxfile.flush();
			} else {
				downloader.setChunkStart(nextStart); 			
			}
			if (error) {
				reset();
				progresslabel.text("Download error!");
			}
		}
	);
	downloader.setInterval(parseInt(chunkTimeoutLabel.value));
	downloader.setChunkSize(parseInt(chunkSizeLabel.value));
	downloader.setUrl(urlInput.value);
	loadButton.disabled = true;
	downloader.start();
}

function start() {
	startButton.disabled = true;
	stopButton.disabled = false;
	downloader.setChunkStart(mp4boxfile.seek(0, true).offset);
	downloader.setChunkSize(parseInt(chunkSizeLabel.value));
	downloader.setInterval(parseInt(chunkTimeoutLabel.value));
	mp4boxfile.start();
	downloader.resume();
}		

function stop() {
	if (!downloader.isStopped()) {
		stopButton.disabled = true;
		startButton.disabled = false;
		downloader.stop();
	}
}		

function play() {
	playButton.disabled = true;
	autoplay = true;
	video.play();
	load();
}

function onSeeking(e) {
	var i, start, end;
	var seek_info;
	if (video.lastSeekTime !== video.currentTime) {
		for (i = 0; i < video.buffered.length; i++) {
			start = video.buffered.start(i);
			end = video.buffered.end(i);
			if (video.currentTime >= start && video.currentTime <= end) {
				return;
			}
		}
		/* Chrome fires twice the seeking event with the same value */
		Log.info("Application", "Seeking called to video time "+Log.getDurationString(video.currentTime));
		downloader.stop();
		resetCues();
		seek_info = mp4boxfile.seek(video.currentTime, true);
		downloader.setChunkStart(seek_info.offset);
		downloader.resume();
		startButton.disabled = true;
		stopButton.disabled = false;
		video.lastSeekTime = video.currentTime;
	}
}

function computeWaitingTimeFromBuffer(v) {
	var ms = v.ms;
	var sb;
	var startRange, endRange;
	var currentTime = v.currentTime;
	var playbackRate = v.playbackRate;
	var maxStartRange = 0;
	var minEndRange = Infinity;
	var ratio;
	var wait;
	var duration;
	/* computing the intersection of the buffered values of all active sourcebuffers around the current time, 
	   may already be done by the browser when calling video.buffered (to be checked: TODO) */
	for (var i = 0; i < ms.activeSourceBuffers.length; i++) {
		sb = ms.activeSourceBuffers[i];
		for (var j = 0; j < sb.buffered.length; j++) {
			startRange = sb.buffered.start(j);
			endRange = sb.buffered.end(j);
			if (currentTime >= startRange && currentTime <= endRange) {
				if (startRange >= maxStartRange) maxStartRange = startRange;
				if (endRange <= minEndRange) minEndRange = endRange;
				break;
			}
		}
	}
	if (minEndRange === Infinity) {
		minEndRange = 0;
	}
	duration = minEndRange - maxStartRange;
	ratio = (currentTime - maxStartRange)/duration;
	Log.info("Demo", "Playback position ("+Log.getDurationString(currentTime)+") in current buffer ["+Log.getDurationString(maxStartRange)+","+Log.getDurationString(minEndRange)+"]: "+Math.floor(ratio*100)+"%");
	if (ratio >= 3/(playbackRate+3)) {
		Log.info("Demo", "Downloading immediately new data!");
		/* when the currentTime of the video is at more than 3/4 of the buffered range (for a playback rate of 1), 
		   immediately fetch a new buffer */
		return 1; /* return 1 ms (instead of 0) to be able to compute a non-infinite bitrate value */
	} else {
		/* if not, wait for half (at playback rate of 1) of the remaining time in the buffer */
		wait = 1000*(minEndRange - currentTime)/(2*playbackRate);
		Log.info("Demo", "Waiting for "+Log.getDurationString(wait,1000)+" s for the next download");
		return wait;
	}
}

function saveBuffer(buffer, name) {		
	if (saveChecked.checked) {
		var d = new DataStream(buffer);
		d.save(name);
	}
}

function updateHtml5TrackInfo() {
	var content = '<table><thead><tr><th>Track ID</th><th>Type</th><th>Kind</th><th>Label</th><th>Language</th><th>Selected/enabled</th></tr></thead><tbody>';
	var i;
	for (i = 0; i < video.videoTracks.length; i++) {
		content += '<tr>'+'<td>'+video.videoTracks[i].id+'</td>'+'<td>video</td>'+'<td>'+video.videoTracks[i].kind+'</td>'+'<td>'+video.videoTracks[i].label+'</td>'+'<td>'+video.videoTracks[i].language+'</td>'+'<td>'+video.videoTracks[i].selected+'</td>'+'</tr>';
	}
	for (i = 0; i < video.audioTracks.length; i++) {
		content += '<tr>'+'<td>'+video.audioTracks[i].id+'</td>'+'<td>audio</td>'+'<td>'+video.audioTracks[i].kind+'</td>'+'<td>'+video.audioTracks[i].label+'</td>'+'<td>'+video.audioTracks[i].language+'</td>'+'<td>'+video.audioTracks[i].enabled+'</td>'+'</tr>';
	}
	for (i = 0; i < video.textTracks.length; i++) {
		content += '<tr>'+'<td>'+video.textTracks[i].id+'</td>'+'<td>text</td>'+'<td>'+video.textTracks[i].kind+'</td>'+'<td>'+video.textTracks[i].label+'</td>'+'<td>'+video.textTracks[i].language+'</td>'+'<td>'+video.textTracks[i].mode+'</td>'+'</tr>';
	}
	content += '</tbody></table>';
	html5MediaDiv.innerHTML = content;
}