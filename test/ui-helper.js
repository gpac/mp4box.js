function createLoadBar(parent, label, id, fileobj, finalizeUI) {
	var loadbar = $('<div></div>');
	loadbar.css("clear", "both");
	loadbar.css("width", "100%");
	parent.append(loadbar);

	var selectdiv = $('<div></div>');
	selectdiv.css("width", "15%").css("float","left");
	loadbar.append(selectdiv);

	var loadbarlabel = $('<label for="'+id+'_input_type">'+label+': </label>');
	selectdiv.append(loadbarlabel);

	var loadbarHTML = '<select name="'+id+'input_type" id="input_type">'+
						'<option selected="selected">File</option>'+
						'<option>URL</option>'+
						'<option>Example</option>'+
						'</select>';
	var loadbarselect = $(loadbarHTML);
	selectdiv.append(loadbarselect);

	var loadbarswitch = $('<div></div>');
	loadbarswitch.css("width", "45%").css("float","left");
	loadbar.append(loadbarswitch);

	var loadbarfileswitch = $('<div></div>');
	loadbarfileswitch.attr('id', id+'_tabs-file');
	loadbarswitch.append(loadbarfileswitch);
	loadbarfileswitch.show();

	var loadbarfileinput = $('<input type="file" id="'+id+'_fileinput">');
	loadbarfileinput[0].onchange = function(e) {
		fileobj.objectToLoad = loadbarfileinput[0].files[0];
		fileobj.objectIsFile = true;
	}
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
		fileobj.objectToLoad = loadbarurlinput.val();
		fileobj.objectIsFile = false;
	}
	loadbarurlswitch.append(loadbarurlinput);

	var loadbarexampleswitch = $('<div></div>');
	loadbarexampleswitch.attr('id', id+'_tabs-example');
	loadbarswitch.append(loadbarexampleswitch);
	loadbarexampleswitch.hide();

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

	loadbarbutton[0].onclick = loadHandler.bind(null, fileobj, loadbarbutton, loadbarprogressbar, loadbarprogressbarlabel, finalizeUI);
}

var chunkSize  = 1024 * 1024; // bytes

function parseFile(fileobj, progressbar, progresslabel, loadbutton, finalizeUI) {
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

function httpload(fileobj, progressbar, progresslabel, loadbutton, finalizeUI) {
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

function loadHandler(fileobj, loadbutton, progressbar, progresslabel, finalizeUI) {
	loadbutton.button( "disable" );
	if (fileobj.objectIsFile) {
		parseFile(fileobj, progressbar, progresslabel, loadbutton, finalizeUI);
	} else {
		httpload(fileobj, progressbar, progresslabel, loadbutton, finalizeUI);
	}
}

function createFancyTree(parent, fileobj) {
	var boxtreeviewdiv = $('<div></div>');
	boxtreeviewdiv.css("width", "45%");
	boxtreeviewdiv.css("float", "left");
	boxtreeviewdiv.css("padding", "1%");
	parent.append(boxtreeviewdiv);

	var boxtreediv = $('<div></div>');
	boxtreeviewdiv.append(boxtreediv);
	boxtreediv.css("width", "30%");
	boxtreediv.css("float", "left");

	var boxtreetable = $('<div></div>');
	boxtreeviewdiv.append(boxtreetable);
	boxtreetable.html(generateBoxTable({}));

	var fancytree_options = {};
	fancytree_options.autoScroll = true;
	fancytree_options.source = [];
	fancytree_options.activate = function(event, data) {
		var node = data.node;
		if( !$.isEmptyObject(node.data) ){
			boxtreetable.html(generateBoxTable(node.data.box));
		}
	};
	boxtreediv.fancytree(fancytree_options);
	fileobj.fancytree = boxtreediv.fancytree('getTree');
}
