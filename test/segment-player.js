/*var segments = {
	mime: 'video/mp4; codecs="avc1.640029"',
	init: "init.mp4",
	segs: [ "1.m4s", "2.m4s"]
};

var segments1 = {
	mime: 'video/mp4; codecs="avc1.640029"',
	init: "mp4-torrents/dashed/seginit.mp4",
	segs: [ "mp4-torrents/dashed/seg1.m4s", "mp4-torrents/dashed/seg2.m4s", "mp4-torrents/dashed/seg3.m4s", "mp4-torrents/dashed/seg4.m4s", "mp4-torrents/dashed/seg5.m4s"]
};

var segments2 = {
	mime: 'video/mp4; codecs="avc1.640029"',
	init: "http://download.tsi.telecom-paristech.fr/gpac/DASH_CONFORMANCE/TelecomParisTech/mp4-live/mp4-live-h264bl_low-.mp4",
	segs: [ "http://download.tsi.telecom-paristech.fr/gpac/DASH_CONFORMANCE/TelecomParisTech/mp4-live/mp4-live-h264bl_low-1.m4s", 
			"http://download.tsi.telecom-paristech.fr/gpac/DASH_CONFORMANCE/TelecomParisTech/mp4-live/mp4-live-h264bl_low-2.m4s"]
};
*/

function getFile(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.responseType = "arraybuffer";
	xhr.onreadystatechange = function (e) { 
		if ((xhr.status == 200 || xhr.status == 206 || xhr.status == 304 || xhr.status == 416) && xhr.readyState == this.DONE) {
			callback(xhr.response); 
		}
	};
	xhr.send();
}

window.onload = function () {
	video = document.getElementById('v');

	mediaSource = new MediaSource();
	mediaSource.video = video;
	video.ms = mediaSource;
	mediaSource.addEventListener("sourceopen", onSourceOpen);
	mediaSource.addEventListener("sourceclose", onSourceClose);
	video.src = window.URL.createObjectURL(mediaSource);
	if (initializeEME) {
		initializeEME(video);
    }
	document.getElementById('dropArea').addEventListener('dragover', dragenter);
	document.getElementById('dropArea').addEventListener('dragenter', dragenter);
	document.getElementById('dropArea').addEventListener('drop', drop);
}

function onSourceClose(e) {
	//alert("MediaSource closed!");
	document.getElementById('dropArea').style.backgroundColor = 'red';

}

function onSourceOpen(e) {
	var ms = e.target;
	sb = ms.addSourceBuffer(document.getElementById("mime").value);
	sb.ms = ms;
	sb.addEventListener('updateend', onUpdateEnd.bind(sb));
	/*
	sb.index = 0;
	getFile(segments.init, sb.appendBuffer.bind(sb));
	*/
}

function onUpdateEnd(e) {
	var sb = this;
	// if (sb.index < segments.segs.length) {
	// 	sb.index++;
	// 	getFile(segments.segs[sb.index-1], sb.appendBuffer.bind(sb));
	// }
	document.getElementById('status').innerHTML = Log.printRanges(sb.buffered);
}

function dragenter(e) {
	e.stopPropagation();
	e.preventDefault();
}

function drop(e) {
	var file;

	if (!e) {
		file = document.getElementById('fileinput').files[0];
	}
	else {
		dragenter(e);
		file = e.dataTransfer.files[0];
	}
	if (file) {
		parseAndAppendFile(file);
	}
}

function parseAndAppendFile(file) {
    var fileSize   = file.size;
    var self       = this; // we need a reference to the current object
    var readBlock  = null;
    var chunkSize  = 50*1024*1024;
	var offset 	   = 0;
	document.getElementById('dropArea').style.backgroundColor = 'yellow';

	var onBlockRead = function(evt) {
        if (evt.target.error == null) {
		 	video = document.getElementById('v');
			video.ms.sourceBuffers[0].appendBuffer(evt.target.result);
        	document.getElementById('status').innerHTML = Log.printRanges(video.ms.sourceBuffers[0].buffered);
            offset += evt.target.result.byteLength;
        } else {
            console.log("Read error: " + evt.target.error);
            return;
        }
        if (offset >= fileSize) {
        	document.getElementById('dropArea').style.backgroundColor = 'green';
        	document.getElementById('status').innerHTML = Log.printRanges(video.ms.sourceBuffers[0].buffered);
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

