var file = {};
file.mp4boxfile = null;
file.objectToLoad = null;
file.objectIsFile = false;
file.fancytree = null;
file.avifFragmentedFile = null;

Log.setLogLevel(Log.debug);

function mseViewAVIFItem(fileobj, loadbutton, success) {
	loadbutton.button("enable");
	if (success) {
		console.log("success");
		file.avifFragmentedFile = file.mp4boxfile.itemToFragmentedTrackFile();
		//initializeMSE();
		 document.getElementById('v').src = window.URL.createObjectURL(new Blob([file.avifFragmentedFile.getBuffer()], {type:'video/mp4; codecs="av01.0.13M.08"'}));
	} else {
		console.log("failure");
	}
}

window.onload = function () {

	createLoadBar($('#menubar'), "File", "file", file, mseViewAVIFItem);

	if (window.location.search) {
		file.objectToLoad = window.location.search.substring(1);
		load();
	}
}

function onUpdateEnd(e) {
	var sb = this;
	// No-op
}

function onSourceClose(e) {
	document.getElementById('dropArea').innerHtml = 'MediaSource closed!';
}

function onSourceOpen(e) {
	var ms = e.target;
	sb = ms.addSourceBuffer('video/mp4; codecs="'+file.avifFragmentedFile.getCodecs()+'"');
	sb.ms = ms;
	sb.addEventListener('updateend', onUpdateEnd.bind(sb));
	file.avifFragmentedFile.save("test.mp4");
	sb.appendBuffer(file.avifFragmentedFile.getBuffer());
}

function initializeMSE() {
	var video = document.getElementById('v');
	mediaSource = new MediaSource();
	mediaSource.video = video;
	video.ms = mediaSource;
	mediaSource.addEventListener("sourceopen", onSourceOpen);
	mediaSource.addEventListener("sourceclose", onSourceClose);
	video.src = window.URL.createObjectURL(mediaSource);
}