Log.setLogLevel(Log.w);

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
		file = e.dataTransfer.files[0];
	}
	readFile(file);
}

function readFile(file) {
  var filePos = 0;
  var reader = new FileReader();
  var mp4box = new MP4Box();

  mp4box.onError = function(e) { console.log("mp4box failed to parse data."); };
  
  mp4box.onMoovStart = function (info) {
    console.log(info);
    reader.abort();
  }

  var append_data_to_mp4box = function(event) {
    var arraybuffer = event.target.result;
    console.log("Received file reading progress event", event);
    if (arraybuffer !== null) {
	    arraybuffer.fileStart = filePos;
	    var readNext = mp4box.appendBuffer(arraybuffer);
	    console.log("Appended data to MP4Box, next offset should be ", readNext);
	    filePos = event.loaded;   // adding fileStart property
    }
  }

  reader.onprogress = append_data_to_mp4box;
  reader.onloadend = append_data_to_mp4box;

  // Read in the mp4 video as ArrayBuffer
  reader.readAsArrayBuffer(file);
}