function Downloader() {
	this.isActive = false;
	this.realtime = false;
	this.chunkStart = 0;
	this.chunkSize = 0;
	this.totalLength = 0;
	this.chunkTimeout = 1000;
	this.url = null;
	this.callback = null;
	this.eof = false;
}

Downloader.prototype.reset = function() {
	this.chunkStart = 0;
	this.totalLength = 0;
	this.eof = false;
}

Downloader.prototype.setRealTime = function(_realtime) {
	this.realtime = _realtime;
}

Downloader.prototype.setChunkSize = function(_size) {
	this.chunkSize = _size;
}

Downloader.prototype.setChunkStart = function(_start) {
	this.chunkStart = _start;
	this.eof = false;
}

Downloader.prototype.setInterval = function(_timeout) {
	this.chunkTimeout = _timeout;
}

Downloader.prototype.setUrl = function(_url) {
	this.url = _url;
}

Downloader.prototype.setCallback = function(_callback) {
	this.callback = _callback;
}

Downloader.prototype.isStopped = function () {
	return !this.isActive;
}

Downloader.prototype.getFileLength = function () {
	return this.totalLength;
}

Downloader.prototype.getFile = function() {
	var dl = this;
	if (dl.totalLength && this.chunkStart>= dl.totalLength) {
		dl.eof = true;
	}
	if (dl.eof === true) {
		Log.i("Downloader", "File download done.");
		this.callback(null, true);
		return;
	}
	var xhr = new XMLHttpRequest();
	xhr.open("GET", this.url, true);
	xhr.responseType = "arraybuffer";
	var range = null;
	xhr.start = this.chunkStart;
	var maxRange;
	if (this.chunkStart+this.chunkSize < Infinity) {
		range = 'bytes=' + this.chunkStart + '-';
		maxRange = this.chunkStart+this.chunkSize-1;
		/* if the file length is known we limit the max range to that length */
		/*if (dl.totalLength !== 0) {
			maxRange = Math.min(maxRange, dl.totalLength);
		}*/
		range += maxRange;
		xhr.setRequestHeader('Range', range);
	}
	xhr.onerror = function(e) {
		dl.callback(null, false, true);
	}
	xhr.onreadystatechange = function (e) { 
		if ((xhr.status == 200 || xhr.status == 206 || xhr.status == 304 || xhr.status == 416) && xhr.readyState == this.DONE) {
			var rangeReceived = xhr.getResponseHeader("Content-Range");
			Log.i("Downloader", "Received data range: "+rangeReceived);
			/* if the length of the file is not known, we get it from the response header */
			if (!dl.totalLength && rangeReceived) {
				var sizeIndex;
				sizeIndex = rangeReceived.indexOf("/");
				if (sizeIndex > -1) {
					dl.totalLength = +rangeReceived.slice(sizeIndex+1);
				}
			}
			dl.eof = (xhr.response.byteLength !== dl.chunkSize) || (xhr.response.byteLength === dl.totalLength);
			xhr.response.fileStart = xhr.start;
			dl.callback(xhr.response, dl.eof); 
			if (dl.isActive === true && dl.eof === false) {
				var timeoutDuration = 0;
				if (!dl.realtime) {
					timeoutDuration = dl.chunkTimeout;
				} else {
					timeoutDuration = computeWaitingTimeFromBuffer(video);
				}
				setDownloadTimeout(timeoutDuration);
				Log.i("Downloader", "Next download scheduled in "+Math.floor(timeoutDuration)+ ' ms.');
				window.setTimeout(dl.getFile.bind(dl), timeoutDuration);
			} else {
				/* end of file */
			}
		}
	};
	if (dl.isActive) {
		Log.i("Downloader", "Fetching "+this.url+(range ? (" with range: "+range): ""));
		xhr.send();
	}
}

Downloader.prototype.start = function() {
	Log.i("Downloader", "Starting file download");
	this.chunkStart = 0;
	this.resume();
}

Downloader.prototype.resume = function() {
	Log.i("Downloader", "Resuming file download");
	this.isActive = true;
	if (this.chunkSize === 0) {
		this.chunkSize = Infinity;
	}
	this.getFile();
}

Downloader.prototype.stop = function() {
	Log.i("Downloader", "Stopping file download");
	this.isActive = false;
}
