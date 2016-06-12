var mp4box;

var boxtree;
var boxtable;
var treeview_node;
var progressbar;
var progresslabel;
var fileinput;
var urlinput;
var fancytree;

Log.setLogLevel(Log.debug);

var chunkSize  = 1024 * 1024; // bytes

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
	if (file) {
		parseFile(file);
	}
}

function initialize() {
	mp4box 	   = new MP4Box(false);	
}

function parseFile(file) {
    var fileSize   = file.size;
    var offset     = 0;
    var self       = this; // we need a reference to the current object
    var readBlock  = null;
 	var startDate  = new Date();
	
	initialize();

	mp4box.onError = function(e) { 
		console.log("mp4box failed to parse data."); 
	};

    var onparsedbuffer = function(mp4box, buffer) {
    	console.log("Appending buffer with offset "+offset);
		buffer.fileStart = offset;
    	mp4box.appendBuffer(buffer);	
	}

	var onBlockRead = function(evt) {
        if (evt.target.error == null) {
            onparsedbuffer(mp4box, evt.target.result); // callback for handling read chunk
            offset += evt.target.result.byteLength;
			progressbar.progressbar({ value: Math.ceil(100*offset/fileSize) });
        } else {
            console.log("Read error: " + evt.target.error);
            return;
        }
        if (offset >= fileSize) {
			progressbar.progressbar({ value: 100 });
            console.log("Done reading file ("+fileSize+ " bytes) in "+(new Date() - startDate)+" ms");
			mp4box.flush();
            finalizeUI();
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

function httpload(url) {	
	var downloader = new Downloader();
	var startDate = new Date();
	var nextStart = 0;

	initialize();

	downloader.setCallback(
		function (response, end, error) { 
			if (response) {
				progressbar.progressbar({ value: Math.ceil(100*downloader.chunkStart/downloader.totalLength) });
				mp4box.appendBuffer(response);
				nextStart += chunkSize;
				
			}
			if (end) {
				progressbar.progressbar({ value: 100 });
	            console.log("Done reading file ("+downloader.totalLength+ " bytes) in "+(new Date() - startDate)+" ms");
				mp4box.flush();
				finalizeUI();
			} else {
				downloader.setChunkStart(nextStart); 
			}
			if (error) {
				progresslabel.text("Download error!")
			}
		}
	);
	downloader.setInterval(10);
	downloader.setChunkSize(chunkSize);
	downloader.setUrl(url);
	downloader.start();	
}

function httploadFromUrl() {
	httpload(urlinput.val());
}

function httploadFromList() {
	httpload(urlSelector.find(":selected").val());
}

function generateBoxTable(box) {
	var html = '<table>';
	html += '<thead>';
	html += '<tr>';
	html += '<th>';
	html += 'Property name';
	html += '</th>';
	html += '<th>';
	html += 'Property value';
	html += '</th>';
	html += '</tr>';
	html += '</thead>';
	html += '<tbody>';
	for (var prop in box) {
		if (["hdr_size", "start", "boxes", "subBoxNames", "entries", "samples", "references", "items", "item_infos", "extents"].indexOf(prop) > -1) {
			continue;
		} else if (box[prop] instanceof BoxParser.Box) {
			continue;
		} else if (typeof box[prop] === "function") {
			continue;
		} else if (box.subBoxNames && box.subBoxNames.indexOf(prop.slice(0,4)) > -1) {
			continue;
		} else {
			html += '<tr>';
			html += '<td><code>';
			html += prop;
			html += '</code></td>';
			html += '<td><code>';
			html += box[prop];
			html += '</code></td>';
			html += '</tr>';
		}
	}
	html += '</tbody>';
	html += '</html>';
	return html;
}

function getFancyTreeData(boxes) {
	var array = [];
	for (var i = 0; i < boxes.length; i++) {
		var box = boxes[i];
		var fancytree_node = {};
		array.push(fancytree_node);
		fancytree_node.title = box.type || i;
		fancytree_node.data = { 'box': box };
		if (box.boxes) {
			fancytree_node.children = getFancyTreeData(box.boxes);
			fancytree_node.folder = true;
		} else if (box.entries) {
			fancytree_node.children = getFancyTreeData(box.entries);
			fancytree_node.folder = true;
		} else if (box.references) {
			fancytree_node.children = getFancyTreeData(box.references);
			fancytree_node.folder = true;
		} else if (box.items) {
			fancytree_node.children = getFancyTreeData(box.items);
			fancytree_node.folder = true;
		} else if (box.item_infos) {
			fancytree_node.children = getFancyTreeData(box.item_infos);
			fancytree_node.folder = true;
		} else if (box.extents) {
			fancytree_node.children = getFancyTreeData(box.extents);
			fancytree_node.folder = true;
		}
	}
	return array;
}

function createBoxTreeView(treeboxes) {
	fancytree.reload(treeboxes);
	fancytree = boxtree.fancytree('getTree');
}

function createBoxView() {
	var treeboxes = getFancyTreeData(mp4box.inputIsoFile.boxes);
	createBoxTreeView(treeboxes);
	var boxnodes = ({ title: "file", children: treeboxes });
	createBoxTreeMapSVG(boxnodes);
	createBoxPartition(boxnodes);
}

function finalizeUI() {
	createBoxView();
	buildItemTable(mp4box.inputIsoFile.items);
	buildSampleView();
	displayMovieInfo(mp4box.getInfo(), document.getElementById("movieview"), false);
}

function buildItemTable(items) {
	var html;
	var i, j;
	html = "<table>";
	html += "<thead>";
	html += "<tr>";
	html += "<th>ID</th>";
	html += "<th>Name</th>";
	html += "<th>Type</th>";
	html += "<th>Primary</th>";
	html += "<th>Protected</th>";
	html += "<th>Byte ranges</th>";
	html += "<th>References [type, item ID]</th>";
	html += "</tr>";
	html += "</thead>";
	html += "<tbody>";
	for (i in items) {
		var item = items[i];
		html += "<tr onclick='displayItemContent("+item.id+");'>";
		html += "<td>"+item.id+"</td>";
		html += "<td>"+(item.name ? item.name: "")+"</td>";
		html += "<td>"+(item.type === "mime" ? item.content_type : item.type)+"</td>";
		html += "<td>"+(item.primary ? "Yes" : "No")+"</td>";
		html += "<td>"+(item.protection ? item.protection : "No")+"</td>";
		html += "<td>";
		for (j = 0; j < item.extents.length; j++) {
			html+= "["+item.extents[j].offset+"-"+(item.extents[j].offset+item.extents[j].length-1)+"] "
		}
		html += "</td>";
		html += "<td>";
		if (item.ref_to) {
			for (j = 0; j < item.ref_to.length; j++) {
				html+= "["+item.ref_to[j].type+", "+item.ref_to[j].id+"] "
			}
		}
		html += "</td>";
		html += "</tr>";
	}
	html += "</tbody>";
	html += "</table>";
	$("#itemview").html(html);
}

function buildSampleTrackView(info, trackSelector, track_index) {
	var graph;

	$("#trackinfo").val(info.tracks[track_index].codec);
	var sampleRangeSlider = $( "#sample-range" );
	var sampleRangeText = $( "#sample-range-value" );
	sampleRangeSlider.dragslider({
		range: true,
		rangeDrag: true,
		min: 0,
		step: 0.01,
		max: 100,
		values: [ trackSelector.startSample/info.tracks[track_index].nb_samples, trackSelector.endSample/info.tracks[track_index].nb_samples ],
		slide: function( event, ui ) {
			trackSelector.startSample = Math.floor(ui.values[0]*info.tracks[track_index].nb_samples/100);
			trackSelector.endSample = Math.floor(ui.values[1]*info.tracks[track_index].nb_samples/100);

			sampleRangeText.val(""+trackSelector.startSample + " - " + trackSelector.endSample+"/"+info.tracks[track_index].nb_samples);

			if ($("#sampletable").is(':visible')) {
				buildSampleTableInfo(info.tracks[track_index].id, trackSelector.startSample, trackSelector.endSample);
			}

			if ($("#samplegraph").is(':visible')) {
			 	graph.data = mp4box.getTrackSamplesInfo(info.tracks[track_index].id).slice(trackSelector.startSample, trackSelector.endSample);
				graph.update();
			}

			if ($("#samplemap").is(':visible')) {
				buildSampleMap(trackSelector.startSample, trackSelector.endSample);
			}
		}
    });


	sampleRangeText.val(""+trackSelector.startSample + " - " + trackSelector.endSample+"/"+info.tracks[track_index].nb_samples);

	if ($("#sampletable").is(':visible')) {
	  	buildSampleTableInfo(info.tracks[track_index].id, trackSelector.startSample, trackSelector.endSample);
	}

 	graph = new SampleGraph();
 	graph.data = mp4box.getTrackSamplesInfo(info.tracks[track_index].id).slice(trackSelector.startSample, trackSelector.endSample);
	if ($("#samplegraph").is(':visible')) {
		graph.update();
	}

	if ($("#samplemap").is(':visible')) {
		buildSampleMap(trackSelector.startSample, trackSelector.endSample);
	}
}

function buildSampleView() {
	var info = mp4box.getInfo();
	var trackSelector = $("#trackSelect");
	trackSelector.startSample = 0;
	trackSelector.endSample = 10;
	trackSelector.html('');
	for (i = 0; i < info.tracks.length; i++) {
		trackSelector.append($("<option></option>").attr("value",i).text(info.tracks[i].id)); 
	}
	trackSelector.selectmenu({
	      width: 100,
	      change: function( event, data ) {
	      	buildSampleTrackView(info, trackSelector, data.item.value);
	      }
	});
	buildSampleTrackView(info, trackSelector, 0);
	buildSampleMap(trackSelector.startSample, trackSelector.endSample);	
}

function buildSampleTableInfo(track_id, start, end) {
	var html;
	var i, j;
	var samples;

	html = "<table>";
	html += "<thead>";
	html += "<tr>";
	html += "<th>Sample number</th>";
	html += "<th>DTS</th>";
	html += "<th>CTS</th>";
	html += "<th>RAP</th>";
	html += "<th>Offset</th>";
	html += "<th>Size</th>";
	html += "</tr>";
	html += "</thead>";
	html += "<tbody>";

	samples = mp4box.getTrackSamplesInfo(track_id);
	if (samples.length < end) end = samples.length;
	for (i = start; i < end; i++) {
		var sample = samples[i];
		html += "<tr>";
		html += "<td>"+sample.number+"</td>";
		html += "<td>"+sample.dts + "("+Log.getDurationString(sample.dts, sample.timescale)+")</td>";
		html += "<td>"+sample.cts + "("+Log.getDurationString(sample.cts, sample.timescale)+")</td>";
		html += "<td>"+sample.is_rap+"</td>";
		html += "<td>"+sample.offset+"</td>";
		html += "<td>"+sample.size+"</td>";
		html += "<td>";
		html += "</tr>";
	}
	html += "</tbody>";
	html += "</table>";
	$("#sampletable").html(html);
}

window.onload = function () {
	boxtree = $('#boxtree');
	boxtable = $('#boxtable');
	progressbar = $('#progressbar');
	progresslabel = $('#progress-label');
	fileinput = $('#fileinput');
	urlinput = $('#urlinput');
	urlSelector = $('#urlSelector');
	progressbar.progressbar({ 
		value: 0, 
		change: function() {
           progresslabel.text( 
              progressbar.progressbar( "value" ) + "%" );
        },
        complete: function() {
           progresslabel.text( "Loading Completed!" );
        }
    });
	fileinput.button();

	var fancytree_options = {};
	fancytree_options.autoScroll = true;
	fancytree_options.source = [];
	fancytree_options.activate = function(event, data) {
		var node = data.node;
		if( !$.isEmptyObject(node.data) ){
			boxtable.html(generateBoxTable(node.data.box));
		}
	};
	boxtree.fancytree(fancytree_options);
	fancytree = boxtree.fancytree('getTree');

	boxtable.html(generateBoxTable({}));

	$("#tabs").tabs();
	$("#resulttabs").tabs();
	$("#boxview").tabs();
	$("#sampleviewtabs").tabs();

	buildUrlList(urlSelector[0], true);
	
	if (window.location.search) {
		httpload(window.location.search.substring(1));
	}
}

function displayItemContent(id) {
	var string;
	var item = mp4box.inputIsoFile.getItem(id);	
	console.log("Item "+id+", content:");
	switch (item.content_type) {
		case "text/plain":
		case "text/html":
		case "text/css":
		case "application/ecmascript":
			string = (new MP4BoxStream(item.data.buffer)).readString(item.data.length);
			console.log(string);
			break;
		default:
			console.log("Cannot display binary data");

	}
	//mp4box.inputIsoFile.releaseItem(id);
}

function createBoxTreeMapSVG(boxnodes) {
	d3.select("#boxmapview").html('');
	var selectDiv = d3.select("#boxmapview").append("div");
	selectDiv.append("span").text("Display D3's TreeMap of boxes based on the ")
	var select = selectDiv.append("select").attr("id", "boxTreeMapSelect");
	select.append("option").attr("value", "size").text("size");
	select.append("option").attr("value", "count").text("number of children");
	selectDiv.append("span").text(" of the box");
    /* from zoomable tree map */
	/* http://mbostock.github.io/d3/talk/20111018/treemap.html */
    var w = 1280 - 80;
    var h = 800 - 180;
    var x = d3.scale.linear().range([0, w]);
    var y = d3.scale.linear().range([0, h]);
    var color = d3.scale.category20c();
    var root, node;

	var treemap = d3.layout.treemap()
	    .round(false)
	    .size([w, h])
	    .sticky(true)
	    .value(size);

	var svg = d3.select("#boxmapview").append("div")
	    .attr("class", "chart")
	    .style("width", w + "px")
	    .style("height", h + "px")
	  .append("svg:svg")
	    .attr("width", w)
	    .attr("height", h)
	  .append("svg:g")
	    .attr("transform", "translate(.5,.5)");

  	node = root = boxnodes;

  	var nodes = treemap.nodes(root)
    	  .filter(function(d) { return !d.children; });

	var cell = svg.selectAll("g")
	      .data(nodes)
	    .enter().append("svg:g")
	      .attr("class", "cell")
	      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
	      .on("click", function(d) { return zoom(node == d.parent ? root : d.parent); });

	cell.append("svg:rect")
	      .attr("width", function(d) { return (d.dx > 1 ? d.dx - 1 : d.dx); })
	      .attr("height", function(d) { return (d.dy > 1 ? d.dy - 1 : d.dy); })
	      .style("fill", function(d) { return color(d.parent.title); });

	cell.append("svg:text")
	      .attr("x", function(d) { return d.dx / 2; })
	      .attr("y", function(d) { return d.dy / 2; })
	      .attr("dy", ".35em")
	      .attr("text-anchor", "middle")
	      .text(function(d) { return d.title; })
	      .style("opacity", function(d) { d.w = this.getComputedTextLength(); return d.dx > d.w ? 1 : 0; });

	svg.on("click", function() { zoom(root); });

  	d3.select("#boxTreeMapSelect").on("change", function() {
    	treemap.value(this.value == "size" ? size : count).nodes(root);
    	zoom(node);
  	});

	function size(d) {
	  return d.size || d.data.box.size;
	}

	function count(d) {
	  return 1;
	}

	function zoom(d) {
	  var kx = w / d.dx, ky = h / d.dy;
	  x.domain([d.x, d.x + d.dx]);
	  y.domain([d.y, d.y + d.dy]);

	  var t = svg.selectAll("g.cell").transition()
	      .duration(d3.event.altKey ? 7500 : 750)
	      .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

	  t.select("rect")
	      .attr("width", function(d) { return ( kx * d.dx > 1 ? kx * d.dx - 1 : kx * d.dx); })
	      .attr("height", function(d) { return ( ky * d.dy > 1 ? ky * d.dy - 1 : ky * d.dy); })

	  t.select("text")
	      .attr("x", function(d) { return kx * d.dx / 2; })
	      .attr("y", function(d) { return ky * d.dy / 2; })
	      .style("opacity", function(d) { return kx * d.dx > d.w ? 1 : 0; });

	  node = d;
	  d3.event.stopPropagation();
	}
}

function createBoxPartition(boxnodes) {
	d3.select("#boxpartitionview").html('');
	/* from Tree Partition example http://mbostock.github.io/d3/talk/20111018/partition.html */
	var selectDiv = d3.select("#boxpartitionview").append("div");
	selectDiv.append("span").text("Display D3's partition of boxes based on the ")
	var select = selectDiv.append("select").attr("id", "partitionSelect");
	select.append("option").attr("value", "size").text("size");
	select.append("option").attr("value", "count").text("number of children");
	selectDiv.append("span").text(" of the box");
	
	var w = 1120,
    	h = 600,
    	x = d3.scale.linear().range([0, w]),
    	y = d3.scale.linear().range([0, h]);

	var div = d3.select("#boxpartitionview").append("div")
										.attr("class", "chart")
										.style("width", w + "px")
										.style("height", h + "px")
										.append("svg:svg")
											.attr("width", w)
											.attr("height", h);

	var partition = d3.layout.partition().value(size);

    var root, node;
	node = root = boxnodes;

  	var g = div.selectAll("g")
	        .data(partition.nodes(root))
		    .enter().append("svg:g")
		    	.attr("transform", function(d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; })
		    	.on("click", click);

  	var kx = w / root.dx,
    	ky = h / 1;

  	g.append("svg:rect")
    	.attr("width", root.dy * kx)
    	.attr("height", function(d) { return d.dx * ky; })
    	.attr("class", function(d) { return d.children ? "parent" : "child"; });

  	g.append("svg:text")
    	.attr("transform", transform)
    	.attr("dy", ".35em")
    	.style("opacity", function(d) { return d.dx * ky > 12 ? 1 : 0; })
    	.text(function(d) { return d.title; })

  	div.on("click", function() { click(root); })

	d3.select("#partitionSelect").on("change", function() {
		partition.value(this.value == "size" ? size : count).nodes(root);
		click(root);
	});

	function size(d) {
	  return d.size || d.data.box.size;
	}

	function count(d) {
	  return 1;
	}


  	function click(d) {
	    if (!d.children) return;

	    kx = (d.y ? w - 40 : w) / (1 - d.y);
	    ky = h / d.dx;
	    x.domain([d.y, 1]).range([d.y ? 40 : 0, w]);
	    y.domain([d.x, d.x + d.dx]);

	    var t = g.transition()
	        .duration(d3.event.altKey ? 7500 : 750)
	        .attr("transform", function(d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; });

	    t.select("rect")
	        .attr("width", d.dy * kx)
	        .attr("height", function(d) { return d.dx * ky; });

	    t.select("text")
	        .attr("transform", transform)
	        .style("opacity", function(d) { return d.dx * ky > 12 ? 1 : 0; });
	    
	    node = d;

	    d3.event.stopPropagation();
	}

  	function transform(d) {
    	return "translate(8," + d.dx * ky / 2 + ")";
  	}
}

function getAllSamples(start, end) {
	var info = mp4box.getInfo();
	var all = [];
	var samples, s;
	var i, j;

	for (i = 0; i < info.tracks.length; i++) {
		samples = mp4box.getTrackSamplesInfo(info.tracks[i].id);
		for (j = start; j < (samples.length > end ? end : samples.length); j++) {
			s = samples[j];  
			s.track = info.tracks[i].id;
			s.time = Math.floor((s.cts / s.timescale)*1000);
			s.position = s.offset;
			all.push(s);
		}
	}
	return all.sort(function (a, b) { return (a.position - b.position); });
}

function buildSampleMap(start, end) {
	d3.select("#samplemap").html('');
	var samples = getAllSamples(start, end);

    var color = d3.scale.category10();
	var w = 1120,
	    h = 600,
	    x = d3.scale.linear().range([0, w]),
	    y = d3.scale.linear().range([0, h]);
	var nbLines = 40;
	var lineheight = h/nbLines;
	var ypos = 0;
	var xpos = 0;
	var scale = 0;
	var s;
	var remainingWidth = w;

	var svg = d3.select("#samplemap").append("div")
		    .attr("class", "chart")
		    .style("width", "100%")
		  .append("svg:svg")
		    .attr("viewBox", "0 0 "+w+" "+h);
    
    for (i = 0; i < samples.length; i++) {
    	s = samples[i];
    	scale += s.size;
    }
    scale /= nbLines;
    scale /= w;

    function addSample(s, v) {
    	var sample_tooltip = 'Sample Information:\n';
    	/*for (var i in s) {
    		sample_tooltip += '  '+i+':\t'+s[i]+'\n';	
    	}*/    	
    	sample_tooltip += '  Track ID:\t'+s.track+'\n';
    	sample_tooltip += '  Number:\t'+s.number+'\n';
    	sample_tooltip += '  Size:\t\t'+s.size+'\n';
    	sample_tooltip += '  Duration:\t'+s.duration+' ('+Log.getDurationString(s.duration, s.timescale)+')\n';
    	sample_tooltip += '  CTS:\t\t'+s.cts+' ('+Log.getDurationString(s.cts, s.timescale)+')\n';
    	sample_tooltip += '  DTS:\t\t'+s.dts+' ('+Log.getDurationString(s.dts, s.timescale)+')\n';
    	sample_tooltip += '  RAP:\t\t'+s.is_rap+'\n';
    	sample_tooltip += '  Offset:\t\t'+s.position+'\n';
    	svg.append("rect")
    			.style("fill", color(s.track))
    			.attr("x", xpos)
    			.attr("y", ypos)
    			.attr("height", lineheight)
	    		.attr("width", v)
	    			.append("title").text(sample_tooltip);
	    svg.append("text")
	        .attr("text-anchor", "middle")
			.attr("dominant-baseline", "central")
	    	.attr("x", xpos+v/2)
	    	.attr("y", ypos+lineheight/2)
	    	.text(s.time)
		    .style("opacity", function(d) { 
		    	var tw = this.getComputedTextLength(); return v > tw ? 1 : 0; 
		    });
    }

    for (i = 0; i < samples.length; i++) {
    	s = samples[i];
	    rw = s.size / scale;
	    while (rw > w - xpos) {
	    	addSample(s, w - xpos);
	    	rw -= (w - xpos);
	    	xpos = 0;
	    	ypos += lineheight;
	    }
	    if (rw > 1) {
	    	addSample(s, rw);
		    xpos += rw;
	    }
    }
}

SampleGraph.prototype.update = function () {
  	var that = this;
	var data = this.data;
	var xaxisChoice = this.xaxisChoice;

	data.forEach(function(d, i) {
    	d.x = (xaxisChoice === "time" ? d.cts : d.number);
    	d.ctso = d.cts - d.dts;
  	});

  	this.x.domain(d3.extent(data, function(d) { return d.x; }));

	this.svg.datum(data);
	this.svg.select(".x.axis")
		.attr("transform", "translate(0," + this.height + ")")
		.call(this.xAxis);

	this.svg.select(".x.axis text.label").text((this.xaxisChoice === "time" ? "CTS" : "Number"));

	for (i = 0; i < this.lines.length; i++) {
		l = this.lines[i];
	  	l.domain = [
	    	d3.min(data, function(d) { return d[l.name]; }),
	    	d3.max(data, function(d) { return d[l.name]; })
	  	];
	  	l.range.domain(l.domain);
		l.line = d3.svg.area().interpolate("linear")
								    .x(function(d) { return that.x(d.x); })
								    .y((function(ll){ 
								    		return function(d) { 
								    			return ll.range(d[l.name]);
								    		};
								    	})(l));
		this.svg.select(".y.axis."+l.name)
			.style("display", (l.visible ? "inline": "none"))
			.call(l.axis);
		this.svg.select("path."+l.name+"line")
			.style("display", (l.visible ? "inline": "none"))
			.attr("d", l.line);
	}
}

function SampleGraph() {
	var i, l;
	var that = this;

	var margin = {top: 10, right: 10, bottom: 80, left: 100};
    var width = this.width = document.body.clientWidth - margin.left - margin.right;
    var height = this.height = window.innerHeight/2 - margin.top - margin.bottom;

  	function DrawableLine(name, color, legend, visible) {
  		this.visible = visible;
  		this.legend = legend;
  		this.name = name;
  		this.color = color;
		this.range = d3.scale.linear().range([height, 0]);
		this.axis = d3.svg.axis().scale(this.range).orient("left").tickFormat(d3.format("d"));
  	}

  	var xaxisChoice = this.xaxisChoice = "number";
  	this.lines = [
	  	new DrawableLine("dts", "purple", "DTS (timescale)", false),
	  	new DrawableLine("cts", "black", "CTS (timescale)", true),
	  	new DrawableLine("size", "blue", "Size (bytes)", false),
	  	new DrawableLine("ctso", "red", "CTS Offset", false),
	  	new DrawableLine("duration", "green", "Duration", false),
	  	new DrawableLine("is_rap", "orange", "RAP", false),
  	];

	var div = d3.select("#samplegraph");
	div.html('');
	var form = div.append("form");
	form.append('span').text('X Axis: ');
	form.append("label").text("Sample number")
			.append("input")
				.attr("type", "radio")
				.attr("value","number")
				.attr("name","xaxis")
				.on("change", function() {
					that.xaxisChoice = "number";
					that.update();
				});
	form.append("label").text("Sample CTS")
			.append("input")
				.attr("type", "radio")
				.attr("value","time")
				.attr("checked","checked")
				.attr("name","xaxis")
				.on("change", function() {
					that.xaxisChoice = "time";
					that.update();
				});
	form.append("br");
	form.append('span').text('Y Axis: ');
	for (i = 0; i < this.lines.length; i++) {
		l = this.lines[i];
		var input = form.append("label")
							.style("color",l.color)
							.text(l.legend)
								.append("input");
		form.append('span').text(' ');
		if (l.visible) {
			input.attr("checked","checked");
		} 
		input.attr("type", "checkbox")						
			.attr("value",l.legend)
			.on("change", (function(ll) {
				return function() {
					ll.visible = this.checked;
					that.update();
				};
			})(l));
	}

	var svg = this.svg = div.append("svg")
		.attr("width", "100%")
		.attr("height", "100%")
	    .attr("viewBox", "0 0 "+(width + margin.left + margin.right)+" "+(height + margin.top + margin.bottom))
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	this.x = d3.scale.linear().range([0, width]);
	this.xAxis = d3.svg.axis().scale(this.x).orient("bottom").tickFormat(d3.format("d"));

	/*var ctspoints = svg.selectAll(".point").data(data);
	ctspoints.attr("stroke", ctsLine.color)
			.attr("fill", function(d, i) { return ctsLine.color; })
			.attr("cx", function(d, i) { return x(d.x) })
			.attr("cy", function(d, i) { return ctsLine.range(d.cts) })
			.attr("r", function(d, i) { return 3 });
	ctspoints.enter().append("svg:circle")
			.attr("class","point")
			.attr("stroke", "black")
			.attr("fill", function(d, i) { return ctsLine.color; })
			.attr("cx", function(d, i) { return x(d.x) })
			.attr("cy", function(d, i) { return ctsLine.range(d.cts) })
			.attr("r", function(d, i) { return 3 });
	ctspoints.exit().remove();*/

	xaxislegend = svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(this.xAxis)
	.append("text")
		.attr("class", "label")
		.attr("x", width - margin.right)
		.attr("y", -6)
		.style("text-anchor", "end")
		.text((xaxisChoice === "time" ? "DTS" : "Number"));

	for (i = 0; i < this.lines.length; i++) {
		l = this.lines[i];
		svg.append("g")
			.attr("class", "y axis "+l.name)
			.style("display", (l.visible ? "inline": "none"))
			.style("fill", l.color)
			.call(l.axis)
			.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 6)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text(l.legend);
		svg.append("path")
			.attr("class", l.name+"line")
			.style("display", (l.visible ? "inline": "none"))
			.style("stroke", l.color);
	}
}