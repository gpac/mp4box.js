
function getFileRange(url, start, end, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.responseType = "arraybuffer";
	if (start !== 0 || end !== Infinity) {
		xhr.setRequestHeader('Range', 'bytes=' + start + '-' + (end == Infinity ? '':end));
	}
	xhr.onreadystatechange = function (e) { 
		if ((xhr.status == 200 || xhr.status == 206 || xhr.status == 304 || xhr.status == 416) && xhr.readyState == this.DONE) {
			xhr.response.fileStart = start;
			callback(xhr.response); 
		}
	};
	xhr.send();
}

function getFile(url, callback) {
	getFileRange(url, 0, Infinity, callback);
}