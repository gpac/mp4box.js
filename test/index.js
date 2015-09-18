/* Setting the level of logs (error, warning, info, debug) */
Log.setLogLevel(Log.info);

/* The main object processing the mp4 files */
var mp4box;
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
var infoDiv, dlTimeoutDiv;
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
	reset();	
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
	overlayTracks.innerHTML = '';
	video.poster = '';
}

function getBasicTrackHeader() {
	var html = '';
	html += "<th>Track ID</th>";
	html += "<th>Track References</th>";
	html += "<th>Alternate Group</th>";
	html += "<th>Creation Date</th>";
	html += "<th>Modified Date</th>";
	html += "<th>Timescale</th>";
	html += "<th>Media Duration</th>";
	html += "<th>Number of Samples</th>";
	html += "<th>Bitrate (kbps)</th>";
	html += "<th>Codec</th>";
	html += "<th>Language</th>";
	html += "<th>Kind</th>";
	html += "<th>Track Width</th>";
	html += "<th>Track Height</th>";
	html += "<th>Track Layer</th>";
	return html;
}

function getBasicTrackInfo(track) {
	var html = '';
	html += "<td>"+track.id+"</td>";
	html += "<td>";
	if (track.references.length === 0) {
		html += "none";
	} else {
		for (var i = 0; i < track.references.length; i++) {
			if (i > 0) html += "<br>";
			html += "Reference of type "+track.references[i]+" to tracks "+track.references[i].track_ids;
		}
	}
	html += "</td>";
	html += "<td>"+track.alternate_group+"</td>";
	html += "<td>"+track.created+"</td>";
	html += "<td>"+track.modified+"</td>";
	html += "<td>"+track.timescale+"</td>";
	html += "<td>"+track.duration+" ("+Log.getDurationString(track.duration,track.timescale)+") </td>";
	html += "<td>"+track.nb_samples+"</td>";
	html += "<td>"+Math.floor(track.bitrate/1024)+"</td>";
	html += "<td>"+track.codec+"</td>";
	html += "<td>"+track.language+"</td>";
	html += "<td>"+track.kind.schemeURI+" - "+track.kind.value+"</td>";
	html += "<td>"+track.track_width+"</td>";
	html += "<td>"+track.track_height+"</td>";
	html += "<td>"+track.layer+"</td>";
	return html;
}

function getVideoTrackHeader() {
	var html = '';
	html += "<th>Width</th>";
	html += "<th>Height</th>";
	return html;
}

function getVideoTrackInfo(track) {
	var html = '';
	html += "<td>"+track.video.width+"</td>";
	html += "<td>"+track.video.height+"</td>";
	return html;
}

function getAudioTrackHeader() {
	var html = '';
	html += "<th>Sample Rate</th>";
	html += "<th>Channel Count</th>";
	html += "<th>Volume</th>";
	return html;
}

function getAudioTrackInfo(track) {
	var html = '';
	html += "<td>"+track.audio.sample_rate+"</td>";
	html += "<td>"+track.audio.channel_count+"</td>";
	html += "<td>"+track.volume+"</td>";
	return html;
}

function getTrackListInfo(tracks, type) {
	var html = '';
	if (tracks.length>0) {
		html += type+" track(s) info";
		html += "<table>";
		html += "<tr>";
		html += getBasicTrackHeader();
		switch (type) {
			case "Video":
				html += getVideoTrackHeader();
				break;				
			case "Audio":
				html += getAudioTrackHeader();
				break;				
			case "Subtitle":
				break;				
			case "Metadata":
				break;				
			case "Hint":
				break;				
			default:
				break;				
		}
		html += "<th>Source Buffer Status</th>";
		html += "</tr>";
		for (var i = 0; i < tracks.length; i++) {
			html += "<tr>";
			html += getBasicTrackInfo(tracks[i]);
			switch (type) {
				case "Video":
					html += getVideoTrackInfo(tracks[i]);
					break;				
				case "Audio":
					html += getAudioTrackInfo(tracks[i]);
					break;				
				case "Subtitle":
					break;				
				case "Metadata":
					break;				
				case "Hint":
					break;	
				default:
					break;
			}					
			var mime = 'video/mp4; codecs=\"'+tracks[i].codec+'\"';
			if (MediaSource.isTypeSupported(mime)) {
				html += "<td id=\"buffer"+tracks[i].id+"\">"+"<input id=\"addTrack"+tracks[i].id+"\" type=\"checkbox\">"+"</td>";
			} else {
				html += "<td>Not supported by your browser, exposing track content using HTML TextTrack <input id=\"addTrack"+tracks[i].id+"\" type=\"checkbox\"></td>";
			}
			html += "</tr>";
		}
		html += "</table>";	
	}
	return html;
}

function displayMovieInfo(info) {
	var html = "Movie Info";
	var fileLength = downloader.getFileLength();
	html += "<div>";
	html += "<table>";
	html += "<tr><th>File Size</th><td>"+fileLength+" bytes</td></tr>";
	html += "<tr><th>Brands</th><td>"+info.brands+"</td></tr>";
	html += "<tr><th>Creation Date</th><td>"+info.created+"</td></tr>";
	html += "<tr><th>Modified Date</th><td>"+info.modified+"</td></tr>";
	html += "<tr><th>Timescale</th><td>"+info.timescale+"</td></tr>";
	html += "<tr><th>Duration</th><td>"+info.duration+" ("+Log.getDurationString(info.duration,info.timescale)+")</td></tr>";
	html += "<tr><th>Bitrate</th><td>"+Math.floor((fileLength*8*info.timescale)/(info.duration*1000))+" kbps</td></tr>";
	html += "<tr><th>Progressive</th><td>"+info.isProgressive+"</td></tr>";
	html += "<tr><th>Fragmented</th><td>"+info.isFragmented+"</td></tr>";
	html += "<tr><th>MPEG-4 IOD</th><td>"+info.hasIOD+"</td></tr>";
	if (info.isFragmented) {
		html += "<tr><th>Fragmented duration</th><td>"+info.fragment_duration+" ("+Log.getDurationString(info.fragment_duration,info.timescale)+")</td></tr>";
	}
	html += "</table>";
	html += getTrackListInfo(info.videoTracks, "Video");
	html += getTrackListInfo(info.audioTracks, "Audio");
	html += getTrackListInfo(info.subtitleTracks, "Subtitle");
	html += getTrackListInfo(info.metadataTracks, "Metadata");
	html += getTrackListInfo(info.otherTracks, "Other");
	html += "</div>";
	infoDiv.innerHTML = html;
}

/* main functions, MSE-related */
function resetMediaSource() {
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
			mp4box.releaseUsedSamples(this.id, this.sampleNum);
			delete this.sampleNum;
		}
	}
	if (this.ms.readyState === "open" && this.updating === false && this.pendingAppends.length > 0) {
		var obj = this.pendingAppends.shift();
		Log.info("MSE - SourceBuffer #"+this.id, "Appending new buffer, pending: "+this.pendingAppends.length);
		this.sampleNum = obj.sampleNum;
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
	if (MediaSource.isTypeSupported(mime)) {
		try {
			Log.info("MSE - SourceBuffer #"+track_id,"Creation with type '"+mime+"'");
			sb = ms.addSourceBuffer(mime);
			sb.ms = ms;
			sb.id = track_id;
			mp4box.setSegmentOptions(track_id, sb, { nbSamples: parseInt(segmentSizeLabel.value) } );
			sb.pendingAppends = [];
		} catch (e) {
			Log.error("MSE - SourceBuffer #"+track_id,"Cannot create buffer with type '"+mime+"'" + e);
		}
	} else {
		Log.warn("MSE", "MIME type '"+mime+"' not supported for creation of a SourceBuffer for track id "+track_id);
		var trackType;
		if (codec == "wvtt" && !kind.schemeURI.startsWith("urn:gpac:")) {
			trackType = "subtitles";
		} else {
			trackType = "metadata";
		}
		var texttrack = video.addTextTrack(trackType, "Text track for track "+track_id);
		texttrack.mode = "showing";
		mp4box.setExtractionOptions(track_id, texttrack, { nbSamples: parseInt(extractionSizeLabel.value) });
		texttrack.codec = codec;
		texttrack.mp4kind = mp4track.kind;
		texttrack.track_id = track_id;
		var div = document.createElement("div");
		div.id = "overlay_track_"+track_id;
		div.setAttribute("class", "overlay");
		overlayTracks.appendChild(div);
		texttrack.div = div;
	}
}

function removeBuffer(video, track_id) {
	var sb;
	var ms = video.ms;
	Log.info("MSE - SourceBuffer #"+track_id,"Removing buffer");
	mp4box.unsetSegmentOptions(track_id);
	for (var i = 0; i < ms.sourceBuffers.length; i++) {
		sb = ms.sourceBuffers[i];
		if (sb.id == track_id) {
			ms.removeSourceBuffer(sb);
			break;
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
		checkBox.addEventListener("change", (function (track_id, codec) { 
			return function (e) {
				var check = e.target;
				if (check.checked) { 
					addBuffer(video, track_id, codec);
					initButton.disabled = false;
					initAllButton.disabled = true;
				} else {
					initButton.disabled = removeBuffer(video, track_id);
					initAllButton.disabled = initButton.disabled;
				}
			};
		})(track.id, track.codec));
	}
}

function initializeAllSourceBuffers() {
	if (movieInfo) {
		var info = movieInfo;
		for (var i = 0; i < info.tracks.length; i++) {
			var track = info.tracks[i];
			addBuffer(video, track);
		}
		initializeSourceBuffers();
	}
}

function initializeSourceBuffers() {
	var initSegs = mp4box.initializeSegmentation();
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

function processInbandCue() {
	var mime = this.track.codec.substring(this.track.codec.indexOf('.')+1);
	var content = "";
	if (this.is_rap & this.track.config) {
		content = this.track.config;
	} 
	content += this.text;
	console.log("Video Time:", video.currentTime, "Processing cue for track "+this.track.track_id+" with:", content);
	if (mime === "application/ecmascript") {
		var script = document.createElement("script");
		script.appendChild(document.createTextNode(content));
		this.track.div.appendChild(script);
		//this.track.div.innerHTML = "<script type='application/ecmascript'>"+content+"</script>";
	} else if (mime === "text/css") {
		this.track.div.innerHTML = "<style>"+content+"</style>";
	} else if (["image/svg+xml", "text/html"].indexOf(mime) > -1 ) {
		/* Presentable track */
		this.track.div.innerHTML = content;
	} else {
		/* Pure metadata track */
	}
}


function load() {
	var ms = video.ms;
	if (ms.readyState !== "open") {
		return;
	}

	mp4box = new MP4Box();
	mp4box.onMoovStart = function () {
		Log.info("Application", "Starting to parse movie information");
	}
	mp4box.onReady = function (info) {
		Log.info("Application", "Movie information received");
		movieInfo = info;
		if (info.isFragmented) {
			ms.duration = info.fragment_duration/info.timescale;
		} else {
			ms.duration = info.duration/info.timescale;
		}
		displayMovieInfo(info);
		addSourceBufferListener(info);
		stop();
		if (autoplay) {
			initializeAllSourceBuffers();
		} else {
			initAllButton.disabled = false;
		}
	}
	mp4box.onSegment = function (id, user, buffer, sampleNum) {	
		var sb = user;
		saveBuffer(buffer, 'track-'+id+'-segment-'+sb.segmentIndex+'.m4s');
		sb.segmentIndex++;
		sb.pendingAppends.push({ id: id, buffer: buffer, sampleNum: sampleNum });
		Log.info("Application","Received new segment for track "+id+" up to sample #"+sampleNum+", segments pending append: "+sb.pendingAppends.length);
		onUpdateEnd.call(sb, true, false);
	}
	mp4box.onSamples = function (id, user, samples) {
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
					cue = new VTTCue(sample.dts/sample.timescale, (sample.dts+sample.duration)/sample.timescale, cueIn4.payl.text);
					texttrack.addCue(cue);
				}
			} else if (sample.description.type === "metx" || sample.description.type === "stpp") {
				sampleParser = new XMLSubtitlein4Parser();
				var xmlSubSample = sampleParser.parseSample(sample); 
				console.log("Parsed XML sample at time "+Log.getDurationString(sample.dts,sample.timescale)+" :", xmlSubSample.document);
				cue = new VTTCue(sample.dts/sample.timescale, (sample.dts+sample.duration)/sample.timescale, xmlSubSample.documentString);
				texttrack.addCue(cue);
				cue.is_rap = sample.is_rap;
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
				cue.is_rap = sample.is_rap;
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
				nextStart = mp4box.appendBuffer(response);
			}
			if (end) {
				progressbar.progressbar({ value: 100 });
				mp4box.flush();
			} else {
				downloader.setChunkStart(nextStart); 			
			}
			if (error) {
				reset();
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
	downloader.setChunkStart(mp4box.seek(0, true).offset);
	downloader.setChunkSize(parseInt(chunkSizeLabel.value));
	downloader.setInterval(parseInt(chunkTimeoutLabel.value));
	mp4box.start();
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
		seek_info = mp4box.seek(video.currentTime, true);
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
