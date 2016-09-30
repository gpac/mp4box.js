var displayDates = false;

function getBasicTrackHeader() {
	var html = '';
	html += "<th>ID</th>";
	html += "<th>References</th>";
	html += "<th>Alternate Group</th>";
	if (displayDates) {
		html += "<th>Creation Date</th>";
		html += "<th>Modified Date</th>";
	}
	html += "<th>Presentation Duration</th>";
	html += "<th>Presentation Edits</th>";
	html += "<th>Duration</th>";
	html += "<th>Timescale</th>";
	html += "<th>Timelines Shift</th>";
	html += "<th>Number of Samples</th>";
	html += "<th>Bitrate (kbps)</th>";
	html += "<th>Codec</th>";
	html += "<th>Language</th>";
	html += "<th>Kind</th>";
	html += "<th>Width</th>";
	html += "<th>Height</th>";
	html += "<th>Layer</th>";
	return html;
}

function getBasicTrackInfo(track) {
	var i;
	var html = '';
	html += "<td>"+track.id+"</td>";
	html += "<td>";
	if (track.references && track.references.length > 0){
		html += "<table>";
		html += "<thead>";
		html += "<tr><th>Type</th><th>Tracks</th></tr>";
		html += "</thead>";
		html += "<tbody>";
		for (i = 0; i < track.references.length; i++) {
			html += "<tr><td>"+track.references[i].type+"</td><td>"+track.references[i].track_ids+"</td></tr>";
		}
		html += "</tbody>";
		html += "</table>";
	}
	html += "</td>";
	html += "<td>"+track.alternate_group+"</td>";
	if (displayDates) {
		html += "<td>"+track.created+"</td>";
		html += "<td>"+track.modified+"</td>";
	}
	html += "<td>"+track.movie_duration+" - "+Log.getDurationString(track.movie_duration,track.movie_timescale)+"</td>";
	html += "<td>";
	if (track.edits && track.edits.length > 0) { 
		html += "<table>";
		html += "<thead>";
		html += "<tr><th>Presentation Duration</th><th>Track Time</th><th>Speed</th></tr>";
		html += "</thead>";
		html += "<tbody>";
		for (i = 0; i < track.edits.length; i++) {
			html += "<tr>";
			html += "<td>"+track.edits[i].segment_duration+" - "+Log.getDurationString(track.edits[i].segment_duration,track.movie_timescale)+"</td>";
			if (track.edits[i].media_time !== -1) {
				html += "<td>"+track.edits[i].media_time+" - "+Log.getDurationString(track.edits[i].media_time,track.timescale)+"</td>";
			} else {
				html += "<td></td>";
			}
			html += "<td>"+track.edits[i].media_rate_integer+"</td>";			
			html += "</tr>";
		}
		html += "</tbody>";
		html += "</table>";
	} 
	html += "</td>";
	html += "<td>"+track.duration+" - "+Log.getDurationString(track.duration,track.timescale)+"</td>";
	html += "<td>"+track.timescale+"</td>";
	html += "<td>";
	if (track.cts_shift) {
		html += "<table>";
		html += "<tr><td>shift</td><td>"+track.cts_shift.compositionToDTSShift+" - "+Log.getDurationString(track.cts_shift.compositionToDTSShift,track.timescale)+"</td></tr>";
		html += "<tr><td>min</td><td>"+track.cts_shift.leastDecodeToDisplayDelta+" - "+Log.getDurationString(track.cts_shift.leastDecodeToDisplayDelta,track.timescale)+"</td></tr>";
		html += "<tr><td>max</td><td>"+track.cts_shift.greatestDecodeToDisplayDelta+" - "+Log.getDurationString(track.cts_shift.greatestDecodeToDisplayDelta,track.timescale)+"</td></tr>";
		html += "<tr><td>start</td><td>"+track.cts_shift.compositionStartTime+" - "+Log.getDurationString(track.cts_shift.compositionStartTime,track.timescale)+"</td></tr>";
		html += "<tr><td>end</td><td>"+track.cts_shift.compositionEndTime+" - "+Log.getDurationString(track.cts_shift.compositionEndTime,track.timescale)+"</td></tr>";
		html += "</table>";	
	}	
	html += "</td>";
	html += "<td>"+track.nb_samples+"</td>";
	html += "<td>"+(Math.floor(track.bitrate*100/1024)/100)+"</td>";
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
	html += "<div class='trackinfo'>";
	if (tracks.length>0) {
		html += type+" track(s) info";
		html += "<table>";
		html += generateTrackHeader(type)
		for (var i = 0; i < tracks.length; i++) {
			html += generateTrackInfo(tracks[i], type);
		}
		html += "</table>";	
	}
	html += '</div>';
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
	html += "<tr><th>File Size / Bitrate</th><td>"+fileLength+" bytes / "+Math.floor((fileLength*8*info.timescale)/(info.duration*1000))+" kbps</td></tr>";
	if (info.timescale) {
		html += "<tr><th>Duration / Timescale</th><td>"+info.duration+"/"+info.timescale+" ("+Log.getDurationString(info.duration,info.timescale)+")</td></tr>";
	}
	html += "<tr><th>Brands (major/compatible)</th><td>"+info.brands+"</td></tr>";
	html += "<tr><th>MIME</th><td>"+info.mime+"</td></tr>";
	html += "<tr><th>Progressive</th><td>"+info.isProgressive+"</td></tr>";
	html += "<tr><th>Fragmented</th><td>"+info.isFragmented+"</td></tr>";
	html += "<tr><th>MPEG-4 IOD</th><td>"+info.hasIOD+"</td></tr>";
	if (info.isFragmented) {
		html += "<tr><th>Fragmented duration</th><td>"+info.fragment_duration+(info.fragment_duration ? " - "+Log.getDurationString(info.fragment_duration,info.timescale):"")+"</td></tr>";
	}
	if (info.created && info.modified) {
		html += "<tr><th>Creation / Modification Dates</th><td>"+dateToInput(info.created)+" / "+ dateToInput(info.modified)+"</td></tr>";
	}
	html += "</table>";
	if (info.videoTracks) {
		html += getTrackListInfo(info.videoTracks, "Video");
	}
	if (info.audioTracks) {
		html += getTrackListInfo(info.audioTracks, "Audio");
	}
	if (info.subtitleTracks) {
		html += getTrackListInfo(info.subtitleTracks, "Subtitle / Text");
	}
	if (info.metadataTracks) {
		html += getTrackListInfo(info.metadataTracks, "Metadata");
	}
	if (info.otherTracks) {
		html += getTrackListInfo(info.otherTracks, "Other");
	}
	html += "</div>";
	div.innerHTML = html;
}

function dateToInput(date) {
	var d = date.getDate();
    var m = date.getMonth()+1;
    var y = date.getFullYear();
    var h = date.getHours();
    var mn = date.getMinutes();
    if(d < 10){
        d = "0"+d;
    }
    if(m < 10){
        m = "0"+m;
    }
    if(h < 10){
        h = "0"+h;
    }
    if(mn < 10){
        mn = "0"+mn;
    }

    return "<input type='date' disabled value='"+y+"-"+m+"-"+d+"'><input type='time' disabled value='"+h+":"+mn+"'>";
}