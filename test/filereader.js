Log.setLogLevel(Log.i);

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

function getBoxTable(box) {
	var html = '<table>';
	for (var prop in box) {
		if (prop === "hdr_size" || prop === "start" || prop === "fileStart" || prop === "boxes" || prop === "subBoxNames" || prop === "entries") {
			continue;
		} else if (box[prop].constructor === Object) {
			continue;
		} else if (box.subBoxNames && box.subBoxNames.indexOf(prop.slice(0,4)) > -1) {
			continue;
		} else {
			html += '<tr>';
			html += '<td>';
			html += prop;
			html += '</td>';
			html += '<td>';
			html += box[prop];
			html += '</td>';
			html += '</tr>';
		}
	}
	html += '</html>';
	return html;
}


function getJSTreeData(boxes) {
	var jstree_data;
	jstree_data = [];
	for (var i = 0; i < boxes.length; i++) {
		var box = boxes[i];
		var jstree_box = {};
		jstree_data.push(jstree_box);
		jstree_box.text = box.type;
		jstree_box.box = box;
		if (box.boxes) {
			jstree_box.children = getJSTreeData(box.boxes);
		} else if (box.entries) {
			jstree_box.children = getJSTreeData(box.entries);
		}
	}
	return jstree_data;
}

function createJSTree(boxes) {
	var jstree_object = {}
	jstree_object.core = {};
	jstree_object.core.data = getJSTreeData(boxes);
	$('#boxtree').jstree(jstree_object);
	$('#boxtree').on('loaded.jstree', function() {
    	$('#boxtree').jstree('open_all');
  	});
	$('#boxtree').on("changed.jstree", function (e, data) {
		if(data.selected.length) {
			var node = data.instance.get_node(data.selected[0]);
			$('#boxtable').html(getBoxTable(node.original.box));
		}
	});	
}

function readFile(file) {
  var filePos = 0;
  var reader = new FileReader();
  var mp4box = new MP4Box();

  mp4box.onError = function(e) { console.log("mp4box failed to parse data."); };
  
  mp4box.onReady = function (info) {
    reader.abort();
    createJSTree(mp4box.inputIsoFile.boxes);
  }

  var append_data_to_mp4box = function(event) {
    var arraybuffer = event.target.result;
    console.log("Received file reading progress event", event, "loaded: "+ event.loaded, "position: "+filePos);
    if (arraybuffer !== null) {
      console.log("ArrayBuffer length: "+arraybuffer.byteLength)
	    arraybuffer.fileStart = 0;
	    var readNext = mp4box.appendBuffer(arraybuffer);
	    console.log("Appended data to MP4Box, next offset should be ", readNext);
    }
  }

  //reader.onprogress = append_data_to_mp4box;
  reader.onloadend = append_data_to_mp4box;

  // Read in the mp4 video as ArrayBuffer
  reader.readAsArrayBuffer(file);
}