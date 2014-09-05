/* Setting the level of logs (error, warning, info, debug) */
Log.setLogLevel(Log.e);

/* The main object processing the mp4 files */
var mp4box;

/* object responsible for file downloading */
var downloader = { stop: true, realtime: false };

/* the HTML5 video element */
var video;

window.onload = function () {
	document.getElementById("loadButton").disabled = true;
	reset();
}

function resetDownloader() {
	downloader.chunkStart = 0;
	downloader.totalLength = 0;
}

function reset() {
	stop();
	resetDownloader();
	document.getElementById("startButton").disabled = true;	
	resetMediaSource();
	resetDisplay();
	setUrl('');
}

function resetMediaSource() {
	var mediaSource;
	video = document.getElementById('v');
	mediaSource = new MediaSource();
	mediaSource.video = video;
	video.ms = mediaSource;
	mediaSource.addEventListener("sourceopen", onSourceOpen);
	mediaSource.addEventListener("sourceclose", onSourceClose);
	video.src = window.URL.createObjectURL(mediaSource);
	/* TODO: remove Text tracks */
}

function resetDisplay() {
	var infoDiv;
	infoDiv = document.getElementById('infoDiv');
	infoDiv.innerHTML = '';
}

function onSourceClose(e) {
	var ms = e.target;
	Log.i("MSE", "Source closed, video error: "+ (ms.video.error ? ms.video.error.code : "(none)"));
	Log.d("MSE", ms);
}

function onSourceOpen(e) {
	var ms = e.target;
	Log.i("MSE", "Source opened");
	Log.d("MSE", ms);
	var selector = document.getElementById('s');
	selector.disabled = false;
}

function onInitAppended(e) {
	var sb = e.target;
	var rangeString = Log.printRanges(sb.buffered);
	Log.d("MSE - SourceBuffer #"+sb.id, "Init segment append ended ("+sb.updating+"), buffered: "+rangeString+", pending: "+sb.pendingAppends.length);
	sb.bufferTd = document.getElementById("buffer"+sb.id);
	sb.bufferTd.textContent = rangeString;
	sb.sampleNum = 0;
	sb.removeEventListener('updateend', onInitAppended);
	sb.addEventListener('updateend', onUpdateEnd.bind(sb));
	/* In case there are already pending buffers we call onUpdateEnd to start appending them*/
	onUpdateEnd.call(sb, null);
}

function onUpdateEnd(e) {
	if (e != null) {
		var rangeString = Log.printRanges(this.buffered);
		Log.i("MSE - SourceBuffer #"+this.id,"Update ended ("+this.updating+"), buffered: "+rangeString+" pending: "+this.pendingAppends.length+" media time: "+Log.getDurationString(video.currentTime));
		this.bufferTd.textContent = rangeString;
	}
	if (this.sampleNum) {
		mp4box.releaseUsedSamples(this.id, this.sampleNum);
		delete this.sampleNum;
	}
	if (this.ms.readyState == "open" && this.pendingAppends.length > 0 && !this.updating) {
		Log.i("MSE - SourceBuffer #"+this.id, "Appending new buffer");
		var obj = this.pendingAppends.shift();
		this.sampleNum = obj.sampleNum;
		this.appendBuffer(obj.buffer);
	}
}

function setUrl(url) {
	var urlInput;
	urlInput = document.getElementById('url');
	urlInput.value = url;
	if (url && url != "") {
		document.getElementById("loadButton").disabled = false;
	}
}

function toggleDownloadMode(event) {
	var checkedBox = event.target;
	if (checkedBox.checked) {
		document.getElementById('dlSpeed').style.display = "none";
		downloader.realtime = true;
	} else {
		document.getElementById('dlSpeed').style.display = "inline";
		downloader.realtime = false;
	}
}

function setDownloadSpeed(value) {
	document.querySelector('#chunk_speed_range_out').value = value;
	downloader.chunkTimeout = parseInt(value);
}

function setDownloadChunkSize(value) {
	document.querySelector('#chunk_size_range_out').value = value;
	downloader.chunkSize = parseInt(value);
}

function setSegmentSize(value) {
	document.querySelector('#segment_size_range_out').value = value;
}

/* Functions to generate the tables displaying file information */	
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
	html += "<th>Codec</th>";
	html += "<th>Language</th>";
	html += "<th>Track Width</th>";
	html += "<th>Track Height</th>";
	html += "<th>Track Layer</th>";
	return html;
}

function getBasicTrackInfo(track) {
	var html = '';
	html += "<td>"+track.id+"</td>";
	html += "<td>";
	if (track.references.length == 0) {
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
	html += "<td>"+track.codec+"</td>";
	html += "<td>"+track.language+"</td>";
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
			}					
			var mime = 'video/mp4; codecs=\"'+tracks[i].codec+'\"';
			if (MediaSource.isTypeSupported(mime)) {
				html += "<td id=\"buffer"+tracks[i].id+"\">"+"<input id=\"addTrack"+tracks[i].id+"\" type=\"checkbox\">"+"</td>";
			} else {
				html += "<td>Not supported, adding as TextTrack <input id=\"addTrack"+tracks[i].id+"\" type=\"checkbox\"></td>";
			}
			html += "</tr>";
		}
		html += "</table>";	
	}
	return html;
}

function displayMovieInfo(info) {
	var html = "Movie Info";
	html += "<div>";
	html += "<table>";
	html += "<tr><th>File Size</th><td>"+downloader.totalLength+" bytes</td></tr>";
	html += "<tr><th>Brands</th><td>"+info.brands+"</td></tr>";
	html += "<tr><th>Creation Date</th><td>"+info.created+"</td></tr>";
	html += "<tr><th>Modified Date</th><td>"+info.modified+"</td></tr>";
	html += "<tr><th>Timescale</th><td>"+info.timescale+"</td></tr>";
	html += "<tr><th>Duration</th><td>"+info.duration+" ("+Log.getDurationString(info.duration,info.timescale)+")</td></tr>";
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
	html += "</div>";
	var infoDiv;
	infoDiv = document.getElementById('infoDiv');
	infoDiv.innerHTML = html;
}

function addSourceBufferListener(info) {
	var v = document.getElementById('v');
	var ms = v.ms;
	for (var i = 0; i < info.tracks.length; i++) {
		var track = info.tracks[i];
		var checkBox = document.getElementById("addTrack"+track.id);
		if (!checkBox) continue;
		checkBox.addEventListener("change", (function (track_id, codec) { 
			return function (e) {
				var check = e.target;
				if (check.checked) { 
					var mime = 'video/mp4; codecs=\"'+codec+'\"';
					if (MediaSource.isTypeSupported(mime)) {
						Log.i("MSE - SourceBuffer #"+track_id,"Creation with type '"+mime+"'");
						var sb = ms.addSourceBuffer(mime);
						sb.ms = ms;
						sb.id = track_id;
						mp4box.setSegmentOptions(track_id, sb, { nbSamples: parseInt(document.getElementById("segment_size_range").value) } );
						sb.pendingAppends = new Array();
						document.getElementById("initButton").disabled = false;
					} else {
						Log.w("MSE", "MIME type '"+mime+"' not supported for creation of a SourceBuffer for track id "+track_id);
						var textrack = v.addTextTrack("subtitles", "Text track for track "+track_id);
						mp4box.setExtractionOptions(track_id, textrack);
						//check.checked = false;
					}
				} else {
					Log.i("MSE - SourceBuffer #"+track_id,"Removing buffer");
					mp4box.unsetSegmentOptions(track_id);
					for (var i = 0; i < ms.sourceBuffers.length; i++) {
						var sb = ms.sourceBuffers[i];
						if (sb.id == track_id) {
							ms.removeSourceBuffer(sb);
							break;
						}
					}
					if (ms.sourceBuffers.length==0) document.getElementById("initButton").disabled = true;
				}
			};
		})(track.id, track.codec));
	}
}

function load() {
	document.getElementById("loadButton").disabled = true;
	var v = document.getElementById('v');
	var ms = v.ms;
	var url = document.getElementById('url').value;
	
	if (ms.readyState != "open") {
		return;
	}

	mp4box = new MP4Box();
	mp4box.onMoovStart = function () {
		Log.i("Application", "Starting to parse movie information");
	}
	mp4box.onReady = function (info) {
		Log.i("Application", "Movie information received");
		stop();
		if (info.isFragmented) {
			ms.duration = info.fragment_duration/info.timescale;
		} else {
			ms.duration = info.duration/info.timescale;
		}
		displayMovieInfo(info);
		addSourceBufferListener(info);
	}
				
	mp4box.onError = function (d) {
	}

	document.getElementById("startButton").disabled = true;
	document.getElementById("stopButton").disabled = false;
	Log.i("Downloader", "Resuming file download");
	downloader.stop = false;
	downloader.chunkTimeout = parseInt(document.getElementById('chunk_speed_range').value);
	downloader.chunkSize = parseInt(document.getElementById('chunk_size_range').value);
	if (downloader.chunkSize == 0) {
		downloader.chunkSize = Infinity;
	}
	downloader.chunkStart = 0;
	downloader.url = url;		
	downloader.callback = function (response, end) { 
							if (response) {
								downloader.chunkStart = mp4box.appendBuffer(response); 
							}
							if (end) {
								mp4box.flush();
							}
						}
	getfile(downloader);
}

function saveBuffer(buffer, name) {		
	var saveChecked = document.getElementById("saveChecked").checked;
	if (saveChecked) {
		var d = new DataStream(buffer);
		d.save(name);
	}
}

function initializeSourceBuffers() {
	mp4box.onSegment = function (id, user, buffer, sampleNum) {	
		var sb = user;
		saveBuffer(buffer, 'track-'+id+'-segment-'+sb.segmentIndex+'.m4s');
		sb.segmentIndex++;
		sb.pendingAppends.push({ id: id, buffer: buffer, sampleNum: sampleNum });
		Log.i("Application","Received new segment for track "+id+" up to sample #"+sampleNum+", segments pending append: "+sb.pendingAppends.length);
		onUpdateEnd.call(sb, null);				
	}

	mp4box.onSamples = function (id, user, samples) {	
		var texttrack = user;
		Log.i("TextTrack #"+id,"Received "+samples.length+" new sample(s)");
		for (var j = 0; j < samples.length; j++) {
			var sample = samples[j];
			if (sample.description.type == "wvtt") {
				var vtt4Parser = new VTTin4Parser();
				var cues = vtt4Parser.parseSample(sample.data);
				for (var i = 0; i < cues.length; i++) {
					var cueIn4 = cues[i];
					var cue = new VTTCue(sample.dts/sample.timescale, (sample.dts+sample.duration)/sample.timescale, cueIn4["payl"].text);
					texttrack.addCue(cue);
				}
			} else {
				var ttml4Parser = new TTMLin4Parser();
				var ttmlSample = ttml4Parser.parseSample(sample); 
			}
		}
	}

	var initSegs = mp4box.initializeSegmentation();
	for (var i = 0; i < initSegs.length; i++) {
		var sb = initSegs[i].user;
		sb.addEventListener("updateend", onInitAppended);
		Log.i("MSE - SourceBuffer #"+sb.id,"Appending initialization data");
		sb.appendBuffer(initSegs[i].buffer);
		saveBuffer(initSegs[i].buffer, 'track-'+initSegs[i].id+'-init.mp4');
		sb.segmentIndex = 0;
	}
	
	document.getElementById("initButton").disabled = true;
	document.getElementById("startButton").disabled = false;
}

function start() {
	document.getElementById("startButton").disabled = true;
	document.getElementById("stopButton").disabled = false;
	Log.i("Downloader", "Resuming file download");
	downloader.stop = false;
	downloader.chunkSize = parseInt(document.getElementById('chunk_size_range').value);
	downloader.chunkTimeout = parseInt(document.getElementById('chunk_speed_range').value);
	if (downloader.chunkSize == 0) {
		downloader.chunkSize = Infinity;
	}
	getfile(downloader);
}		

function stop() {
	if (!downloader.stop) {
		document.getElementById("stopButton").disabled = true;
		document.getElementById("startButton").disabled = false;
		Log.i("Downloader", "Stopping file download");
		downloader.stop = true;
	}
}		

function computeWaitingTimeFromBuffer(v) {
	var ms = v.ms;
	var sb;
	var startRange, endRange;
	var currentTime = v.currentTime;
	var maxStartRange = 0;
	var minEndRange = Infinity;
	var duration;
	for (var i = 0; i < ms.activeSourceBuffers.length; i++) {
		sb = ms.activeSourceBuffers.item(i);
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
	duration = minEndRange - maxStartRange;
	if (currentTime + duration/4 >= minEndRange) return 0;
	else /*if (currentTime - duration/4 <= maxStartRange)*/ return 1000*(minEndRange-currentTime)/2;
	//return 1000*(minEndRange - currentTime)/2;
}

function getfile(dl) {
	if (dl.chunkStart == Infinity) {
		Log.i("Downloader", "File download done.");
		dl.callback(null, true);
		return;
	}
	var xhr = new XMLHttpRequest;
	xhr.open("GET", dl.url, true);
	xhr.responseType = "arraybuffer";
	var range = null;
	xhr.start = dl.chunkStart;
	if (dl.chunkStart+dl.chunkSize < Infinity) {
		range = 'bytes=' + dl.chunkStart + '-';
		range += (dl.chunkStart+dl.chunkSize-1);
		xhr.setRequestHeader('Range', range);
	}
	xhr.onreadystatechange = function (e) { 
		if ((xhr.status == 200 || xhr.status == 206 || xhr.status == 304 || xhr.status == 416) && xhr.readyState == this.DONE) {
			var rangeReceived = xhr.getResponseHeader("Content-Range");
			Log.d("Downloader", "Received data range: "+rangeReceived);
			if (!dl.totalLength) {
				var sizeIndex;
				sizeIndex = rangeReceived.indexOf("/");
				if (sizeIndex > -1) {
					dl.totalLength = +rangeReceived.slice(sizeIndex+1);
				}
			}
			var eof = !(xhr.response.byteLength == dl.chunkSize);
			xhr.response.fileStart = xhr.start;
			dl.callback(xhr.response, eof); 
			//dl.chunkStart+=dl.chunkSize;
			if (dl.stop == false && eof == false) {
				var timeoutDuration = 0;
				if (!dl.realtime) {
					timeoutDuration = dl.chunkTimeout;
				} else {
					timeoutDuration = computeWaitingTimeFromBuffer(video);
				}
				Log.i("Downloader", "Next download scheduled in "+timeoutDuration+ ' ms.');
				window.setTimeout(getfile.bind(this, dl, dl.callback), timeoutDuration);
			} else {
				/* end of file */
			}
		}
	};
	Log.d("Downloader", "Fetching "+dl.url+(range ? (" with range: "+range): ""));
	xhr.send();
}	