var file_a = {};
file_a.mp4boxfile = null;
file_a.objectToLoad = null;
file_a.objectIsFile = false;
file_a.fancytree = null;

var file_b = {};
file_b.mp4boxfile = null;
file_b.objectToLoad = null;
file_b.objectIsFile = false;
file_b.fancytree = null;

Log.setLogLevel(Log.debug);

var chunkSize  = 1024 * 1024; // bytes

function parseFile(fileobj, progressbar, progresslabel, loadbutton) {
    var fileSize   = fileobj.objectToLoad.size;
    var offset     = 0;
    var self       = this; // we need a reference to the current object
    var readBlock  = null;
 	var startDate  = new Date();

	fileobj.mp4boxfile = MP4Box.createFile(false);

	fileobj.mp4boxfile.onError = function(e) {
		console.log("Failed to parse ISOBMFF data");
	};

    var onparsedbuffer = function(mp4boxfileobj, buffer) {
    	console.log("Appending buffer with offset "+offset);
		buffer.fileStart = offset;
    	mp4boxfileobj.appendBuffer(buffer);
	}

	var onBlockRead = function(evt) {
        if (evt.target.error == null) {
            onparsedbuffer(fileobj.mp4boxfile, evt.target.result); // callback for handling read chunk
            offset += evt.target.result.byteLength;
			progressbar.progressbar({ value: Math.ceil(100*offset/fileSize) });
        } else {
            console.log("Read error: " + evt.target.error);
            finalizeUI(fileobj, loadbutton, false);
            return;
        }
        if (offset >= fileSize) {
			progressbar.progressbar({ value: 100 });
            console.log("Done reading file ("+fileSize+ " bytes) in "+(new Date() - startDate)+" ms");
			fileobj.mp4boxfile.flush();
            finalizeUI(fileobj, loadbutton, true);
            return;
        }

        readBlock(offset, chunkSize, fileobj.objectToLoad);
    }

    readBlock = function(_offset, length, _file) {
        var r = new FileReader();
        var blob = _file.slice(_offset, length + _offset);
        r.onload = onBlockRead;
        r.readAsArrayBuffer(blob);
    }

    readBlock(offset, chunkSize, fileobj.objectToLoad);
}

function httpload(fileobj, progressbar, progresslabel, loadbutton) {
	var downloader = new Downloader();
	var startDate = new Date();
	var nextStart = 0;

	fileobj.mp4boxfile = MP4Box.createFile(false);

	downloader.setCallback(
		function (response, end, error) {
			if (response) {
				progressbar.progressbar({ value: Math.ceil(100*downloader.chunkStart/downloader.totalLength) });
				fileobj.mp4boxfile.appendBuffer(response);
				nextStart += chunkSize;
			}
			if (end) {
				progressbar.progressbar({ value: 100 });
	            console.log("Done reading file ("+downloader.totalLength+ " bytes) in "+(new Date() - startDate)+" ms");
				fileobj.mp4boxfile.flush();
				finalizeUI(fileobj, loadbutton, true);
			} else {
				downloader.setChunkStart(nextStart);
			}
			if (error) {
				progresslabel.text("Download error!")
				finalizeUI(fileobj, loadbutton, false);
			}
		}
	);
	downloader.setInterval(10);
	downloader.setChunkSize(chunkSize);
	downloader.setUrl(fileobj.objectToLoad);
	downloader.start();
}

function loadHandler(fileobj, loadbutton, progressbar, progresslabel) {
	loadbutton.button( "disable" );
	if (fileobj.objectIsFile) {
		parseFile(fileobj, progressbar, progresslabel, loadbutton);
	} else {
		httpload(fileobj, progressbar, progresslabel, loadbutton);
	}
}

function createFancyTree(parent, fileobj) {
	var fancytree_options = {};
	fancytree_options.autoScroll = true;
	fancytree_options.source = [];
	var boxtreediv = $('<div></div>');
	boxtreediv.css("width", "45%");
	boxtreediv.css("float", "left");
	boxtreediv.css("padding", "1%");
	parent.append(boxtreediv);
	boxtreediv.fancytree(fancytree_options);
	fileobj.fancytree = boxtreediv.fancytree('getTree');
}

window.onload = function () {

	createLoadBar($('#menubar'), "File A", "fileA", file_a);
	createLoadBar($('#menubar'), "File B", "fileB", file_b);

	createFancyTree($('#resulttabs'), file_a);
	createFancyTree($('#resulttabs'), file_b);

	if (window.location.search) {
		objectToLoad = window.location.search.substring(1);
		load();
	}
}

function getFancyTreeDataFromBoxes(boxes, expected_boxes) {
	var array = [];
	for (var i = 0; i < boxes.length; i++) {
		var box = boxes[i];
		var expected_box = (expected_boxes ? expected_boxes[i] : undefined);
		var fancytree_node = {};
		array.push(fancytree_node);
		fancytree_node.title = box.type || i;
		fancytree_node.data = { 'box': box };
		if (!mp4box_box_equal(box, expected_box)) {
			fancytree_node.extraClasses = 'treediff';
		}
		var child_prop_names = [ "boxes", "entries", "references", "subsamples",
								 "items", "item_infos", "extents", "associations", "subsegments", "ranges", "seekLists", "seekPoints", "esd", "levels"];
		for (var j = 0; j < child_prop_names.length; j++) {
			var name = child_prop_names[j];
			if (box[name]) {
				fancytree_node.folder = true;
				if (name === "esd") {
					fancytree_node.children = getFancyTreeDataFromDesc(box[name], expected_box ? expected_box[name] : expected_box);
				} else {
					fancytree_node.children = getFancyTreeDataFromBoxes(box[name], expected_box ? expected_box[name] : expected_box);
				}
			}
		}
	}
	return array;
}

function finalizeUI(fileobj, loadbutton, success) {
	loadbutton.button("enable");
	if (success) {

		if (file_a.mp4boxfile != null && file_b.mp4boxfile != null) {

			var treeboxes = getFancyTreeDataFromBoxes(file_a.mp4boxfile.boxes, file_b.mp4boxfile.boxes);
			file_a.fancytree.reload(treeboxes);

			var treeboxes = getFancyTreeDataFromBoxes(file_b.mp4boxfile.boxes, file_a.mp4boxfile.boxes);
			file_b.fancytree.reload(treeboxes);

			if (mp4box_file_equal(file_a.mp4boxfile, file_b.mp4boxfile)) {
				console.log("Files are equal");
			} else {
				console.log("Files are different");
			}
		}
	} else {
	}
}

function createLoadBar(parent, label, id, fileobj) {
	var loadbar = $('<div></div>');
	loadbar.css("clear", "both");
	loadbar.css("width", "100%");
	parent.append(loadbar);

	var selectdiv = $('<div></div>');
	selectdiv.css("width", "15%").css("float","left");
	loadbar.append(selectdiv);

	var loadbarlabel = $('<label for="'+id+'_input_type">'+label+': </label>');
	selectdiv.append(loadbarlabel);

	var loadbarselect = $('<select name="'+id+'input_type" id="input_type">\
			      <option>File</option>\
			      <option>URL</option>\
			      <option selected="selected">Example</option>\
			    </select>');
	selectdiv.append(loadbarselect);

	var loadbarswitch = $('<div></div>');
	loadbarswitch.css("width", "45%").css("float","left");
	loadbar.append(loadbarswitch);

	var loadbarfileswitch = $('<div></div>');
	loadbarfileswitch.attr('id', id+'_tabs-file');
	loadbarswitch.append(loadbarfileswitch);
	loadbarfileswitch.hide();

	var loadbarfileinput = $('<input type="file" id="'+id+'_fileinput">');
	loadbarfileinput.width(500);
	loadbarfileinput.button();

	loadbarfileswitch.append(loadbarfileinput);

	var loadbarurlswitch = $('<div></div>');
	loadbarurlswitch.attr('id', id+'_tabs-url');
	loadbarswitch.append(loadbarurlswitch);
	loadbarurlswitch.hide();

	var loadbarurlinput = $('<input type="url" id="'+id+'_urlinput">');
	loadbarurlinput.width(500);
	loadbarurlinput.addClass("ui-widget ui-widget-content ui-corner-all");

	loadbarurlinput[0].onchange = function(e) {
		fileobj.objectToLoad = urlinput.val();
		fileobj.objectIsFile = false;
		console.log(fileobj.objectIsFile, fileobj.objectToLoad);
	}
	loadbarurlswitch.append(loadbarurlinput);

	var loadbarexampleswitch = $('<div></div>');
	loadbarexampleswitch.attr('id', id+'_tabs-example');
	loadbarswitch.append(loadbarexampleswitch);

	var loadbarexampleselect = $('<select id="'+id+'_urlSelector"></select>');
	loadbarexampleswitch.append(loadbarexampleselect);
	loadbarexampleselect.selectmenu({
		width: 500,
		change: function(e) {
			fileobj.objectIsFile = false;
			fileobj.objectToLoad = loadbarexampleselect.find(":selected").val();
		}
	});
	buildUrlList(loadbarexampleselect[0], true);
	fileobj.objectToLoad = loadbarexampleselect.find(":selected").val();
	loadbarexampleselect.val(fileobj.objectToLoad);
	loadbarexampleselect.selectmenu("refresh");

	var loadbarbutton = $('<button style="width: 5%; float: left;" id="'+id+'_LoadButton">Load</button>');
	loadbarbutton.button();
	loadbar.append(loadbarbutton);

	var loadbarprogressbar = $('<div id="'+id+'_progressbar" style="width: 34%; float: left;"></div>');
	var loadbarprogressbarlabel = $('<div id="'+id+'_progress-label" style="text-align: center;">0%</div>');
	loadbarprogressbar.append(loadbarprogressbarlabel);
	loadbar.append(loadbarprogressbar);

	loadbarselect.selectmenu({
		width: 150,
		change: function (e) {
			switch(e.target.selectedOptions[0].value) {
				case "File":
					loadbarfileswitch.show();
					loadbarurlswitch.hide();
					loadbarexampleswitch.hide();
					break;
				case "URL":
					loadbarfileswitch.hide();
					loadbarurlswitch.show();
					loadbarexampleswitch.hide();
					break;
				case "Example":
					loadbarfileswitch.hide();
					loadbarurlswitch.hide();
					loadbarexampleswitch.show();
					break;
			}
		}
	});

	loadbarprogressbar.progressbar({
		value: 0,
		change: function() {
           loadbarprogressbarlabel.text(
              loadbarprogressbar.progressbar( "value" ) + "%" );
        },
        complete: function() {
           loadbarprogressbarlabel.text( "Loading Completed!" );
        }
    });

	loadbarbutton[0].onclick = loadHandler.bind(null, fileobj, loadbarbutton, loadbarprogressbar, loadbarprogressbarlabel);
}

var MP4BOX_BOXES_PROP_NAMES = [ "boxes", "entries", "references", "subsamples",
					 	 "items", "item_infos", "extents", "associations",
					 	 "subsegments", "ranges", "seekLists", "seekPoints",
					 	 "esd", "levels"];

var MP4BOX_PRIMITIVE_ARRAY_PROP_NAMES = [ "compatible_brands" ];

function mp4box_box_equal_fields(box_a, box_b) {
	if (box_a && !box_b) return false;
	var prop;
	for (prop in box_a) {
		if (MP4BOX_BOXES_PROP_NAMES.indexOf(prop) > -1) {
			continue;
		// } else if (excluded_fields && excluded_fields.indexOf(prop) > -1) {
		// 	continue;
		} else if (box_a[prop] instanceof BoxParser.Box || box_b[prop] instanceof BoxParser.Box) {
			continue;
		} else if (typeof box_a[prop] === "undefined" || typeof box_b[prop] === "undefined") {
			continue;
		} else if (typeof box_a[prop] === "function" || typeof box_b[prop] === "function") {
			continue;
		} else if (
			(box_a.subBoxNames && box_a.subBoxNames.indexOf(prop.slice(0,4)) > -1) ||
			(box_b.subBoxNames && box_b.subBoxNames.indexOf(prop.slice(0,4)) > -1))  {
			continue;
		} else {
			if (prop === "data") {
				continue;
			} else if (MP4BOX_PRIMITIVE_ARRAY_PROP_NAMES.indexOf(prop) > -1) {
				continue;
			} else {
				if (box_a[prop] !== box_b[prop]) {
					return false;
				}
			}
		}
	}
	return true;
}

function mp4box_box_equal(box_a, box_b) {
	if (!mp4box_box_equal_fields(box_a, box_b)) {
		return false;
	}
	for (var j = 0; j < MP4BOX_BOXES_PROP_NAMES.length; j++) {
		var name = MP4BOX_BOXES_PROP_NAMES[j];
		if (box_a[name] && box_b[name]) {
			if (!mp4box_box_equal(box_a[name], box_b[name])) {
				return false;
			}
		}
	}
	return true;
}

function mp4box_file_equal(a, b) {
	var box_index = 0;
	while (box_index < a.boxes.length && box_index < b.boxes.length) {
		var a_box = a.boxes[box_index];
		var b_box = b.boxes[box_index];
		if (!mp4box_box_equal(a_box, b_box)) {
			return false;
		}
		box_index++;
	}
	return true;
}