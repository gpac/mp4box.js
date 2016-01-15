var displayDates = false;

function getBasicTrackHeader() {
	var html = '';
	html += "<th>Track ID</th>";
	html += "<th>Track References</th>";
	html += "<th>Alternate Group</th>";
	if (displayDates) {
		html += "<th>Creation Date</th>";
		html += "<th>Modified Date</th>";
	}
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
	if (displayDates) {
		html += "<td>"+track.created+"</td>";
		html += "<td>"+track.modified+"</td>";
	}
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

function generateTrackHeader(type) {
	var html = '';
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
	if (displaySourceBuffer) {
		html += "<th>Source Buffer Status</th>";
	}
	html += "</tr>";
	return html;
}

function generateTrackInfo(track, type) {
	var html = '';
	html += "<tr>";
	html += getBasicTrackInfo(track);
	switch (type) {
		case "Video":
			html += getVideoTrackInfo(track);
			break;				
		case "Audio":
			html += getAudioTrackInfo(track);
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
	if (displaySourceBuffer) {
		var mime = 'video/mp4; codecs=\"'+track.codec+'\"';
		if (MediaSource.isTypeSupported(mime)) {
			html += "<td id=\"buffer"+track.id+"\">"+"<input id=\"addTrack"+track.id+"\" type=\"checkbox\">"+"</td>";
		} else {
			html += "<td>Not supported by your browser, exposing track content using HTML TextTrack <input id=\"addTrack"+track.id+"\" type=\"checkbox\"></td>";
		}
	}
	html += "</tr>";
	return html;
}

function getTrackListInfo(tracks, type) {
	var html = '';
	if (tracks.length>0) {
		html += type+" track(s) info";
		html += "<table>";
		html += generateTrackHeader(type)
		for (var i = 0; i < tracks.length; i++) {
			html += generateTrackInfo(tracks[i], type);
		}
		html += "</table>";	
	}
	return html;
}

var displaySourceBuffer = true;
function displayMovieInfo(info, div, _displaySourceBuffer) {
	if (_displaySourceBuffer !== undefined) displaySourceBuffer = _displaySourceBuffer;
	var html = "Movie Info";
	var fileLength = 0;
	if (typeof(downloader) !== "undefined") {
		downloader.getFileLength();
	}
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
	html += getTrackListInfo(info.subtitleTracks, "Subtitle / Text");
	html += getTrackListInfo(info.metadataTracks, "Metadata");
	html += getTrackListInfo(info.otherTracks, "Other");
	html += "</div>";
	div.innerHTML = html;
}