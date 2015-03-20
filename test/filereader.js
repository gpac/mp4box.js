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
	parseFile(file);
}

function getBoxTable(box) {
	var html = '<table>';
	html += '<tr>';
	html += '<td>';
	html += 'Property name';
	html += '</td>';
	html += '<td>';
	html += 'Property value';
	html += '</td>';
	html += '</tr>';
	for (var prop in box) {
		if (["hdr_size", "start", "fileStart", "boxes", "subBoxNames", "entries", "samples"].indexOf(prop) > -1) {
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
		/* following line is commented out for now as jstree is extremely slow otherwise */
		//jstree_box.data = { 'box': box };
		if (box.boxes) {
			jstree_box.children = getJSTreeData(box.boxes);
		} else if (box.entries) {
			jstree_box.children = getJSTreeData(box.entries);
		}
	}
	return jstree_data;
}

function createJSTree(boxes) {
	var jstree_node = $('#boxtree');
	var jstree_object = { 'core' : {}} ;
	jstree_object.core.data = getJSTreeData(boxes);

	jstree_node.on('loaded.jstree', function() {
    	$('#boxtree').jstree('open_all');
  	});
	jstree_node.on("changed.jstree", function (e, data) {
		$('#boxtable').html(getBoxTable(data.node.data.box));
	});
	jstree_node.jstree(jstree_object);
}

function parseFile(file) {
    var fileSize   = file.size;
    var chunkSize  = 1024 * 1024; // bytes
    var offset     = 0;
    var self       = this; // we need a reference to the current object
    var readBlock  = null;
 	var mp4box 	   = new MP4Box();

	mp4box.onError = function(e) { 
		console.log("mp4box failed to parse data."); 
	};

    var onparsedbuffer = function(mp4box, buffer) {
    	console.log("Appending buffer with offset "+offset);
		buffer.fileStart = offset;
    	//mp4box.appendBuffer(buffer);	
		//createJSTree(mp4box.inputIsoFile.boxes);
	}

	var onBlockRead = function(evt) {
        if (evt.target.error == null) {
            onparsedbuffer(mp4box, evt.target.result); // callback for handling read chunk
            offset += evt.target.result.byteLength;
        } else {
            console.log("Read error: " + evt.target.error);
            return;
        }
        if (offset >= fileSize) {
            console.log("Done reading file");
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