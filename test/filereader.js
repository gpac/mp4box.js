var file = {};
file.mp4boxfile = null;
file.objectToLoad = null;
file.objectIsFile = false;
file.fancytree = null;

Log.setLogLevel(Log.debug);

function createBoxView() {
	var treeboxes = getFancyTreeDataFromBoxes(file.mp4boxfile.boxes);
	file.fancytree.reload(treeboxes);
	var boxnodes = ({ title: "file", children: treeboxes });
	createBoxTreeMapSVG(boxnodes);
	createBoxPartition(boxnodes);
}

function resetBoxView() {
	file.fancytree.reload([]);
	d3.select("#boxmapview").html('');
	d3.select("#boxpartitionview").html('');
}

function finalizeAnalyzerUI(fileobj, loadbutton, success) {
	loadbutton.button("enable");
	if (success) {
		createBoxView();
		buildItemTable(fileobj.mp4boxfile.items);
		buildSampleView();
		displayMovieInfo(fileobj.mp4boxfile.getInfo(), document.getElementById("movieview"), false);
	} else {
		resetBoxView();
		$("#itemview").html('');
		resetSampleView();
		$("#movieview").html('');
	}
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
	html += "<th>Properties [type]</th>";
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
		for (j = 0; j < (item.extents ? item.extents.length : 0); j++) {
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
		html += "<td>";
		if (item.properties) {
			for (j = 0; j < item.properties.boxes.length; j++) {
				html+= ""+item.properties.boxes[j].type+" "
			}
		}
		html += "</td>";
		html += "</tr>";
	}
	html += "</tbody>";
	html += "</table>";
	$("#itemview").html(html);
}

function resetSampleView() {
	$("#sampletable").html('');
	$("#samplemap").html('');
	$("#trackinfo").val('');
	$("#trackSelect").html('');
	$("#sample-range-value").val('');
	$("#samplegraph").html('');
	$("#sampletimeline").html('');
}

function buildSampleTrackView(info, trackSelector, track_index) {
	var graph;
	var timeline;

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
			 	graph.data = file.mp4boxfile.getTrackSamplesInfo(info.tracks[track_index].id).slice(trackSelector.startSample, trackSelector.endSample);
				graph.update();
			}

			if ($("#sampletimeline").is(':visible')) {
			 	timeline.data = file.mp4boxfile.getTrackSamplesInfo(info.tracks[track_index].id).slice(trackSelector.startSample, trackSelector.endSample);
				timeline.update();
			}

			if ($("#samplemap").is(':visible')) {
				buildSampleMap(trackSelector.startSample, trackSelector.endSample);
			}
		}
    });


	sampleRangeText.val(""+trackSelector.startSample + " - " + trackSelector.endSample+"/"+info.tracks[track_index].nb_samples);

  	buildSampleTableInfo(info.tracks[track_index].id, trackSelector.startSample, trackSelector.endSample);

 	graph = new SampleGraph();
 	graph.data = file.mp4boxfile.getTrackSamplesInfo(info.tracks[track_index].id).slice(trackSelector.startSample, trackSelector.endSample);
	graph.update();

 	timeline = new SampleTimeline();
 	timeline.data = file.mp4boxfile.getTrackSamplesInfo(info.tracks[track_index].id).slice(trackSelector.startSample, trackSelector.endSample);
	timeline.update();

	buildSampleMap(trackSelector.startSample, trackSelector.endSample);
}

function buildSampleView() {
	var info = file.mp4boxfile.getInfo();
	if (info.tracks) {
		$("#trackinfo").addClass("ui-widget ui-widget-content ui-corner-all");
		$("#sample-range-value").addClass("ui-widget ui-widget-content ui-corner-all");
		var trackSelector = $("#trackSelect");
		trackSelector.selectmenu();
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
		trackSelector.val(info.tracks[0].id);
		trackSelector.selectmenu("refresh");
		buildSampleTrackView(info, trackSelector, 0);
		buildSampleMap(trackSelector.startSample, trackSelector.endSample);	
	}
}

function buildSampleTableInfo(track_id, start, end) {
	var html;
	var i, j;
	var samples;
	var properties = ["number", "dts", "cts", "offset", "size", "is_sync", "is_leading", "depends_on", "is_depended_on",
					  "has_redundancy", "degradation_priority"];
	var prop;
	var sample;
	var trak;
	var sample_group_info;
	var sample_group_name;

	function getShowHidePropertyCheckbox(name) {
		var html = "<label>";
		var esc_name = name.replace('/','_');
		html += name;
		html += "<input name='check_"+esc_name+"' type='checkbox' checked='checked' value='"+esc_name+"'";
		html +=" onchange='if (!this.checked) { $(\".stbl_"+esc_name+"\").hide(); } else { $(\".stbl_"+esc_name+"\").show();} '>";
		html += "</label>";
		return html;
	}

	trak = file.mp4boxfile.getTrackById(track_id);

	html = "<div style='margin-top: 10px;margin-bottom: 10px;'>Show sample properties: ";
	for (prop in properties) {
		html += getShowHidePropertyCheckbox(properties[prop]);
	}
	if (trak.mdia.minf.stbl.subs || trak.has_fragment_subsamples) {
		html += getShowHidePropertyCheckbox("subsamples");
	}
	if (trak && trak.sample_groups_info) {
		html += "<br>";
		html += "Show sample groups: ";
		for (j in trak.sample_groups_info) {
			sample_group_info = trak.sample_groups_info[j];
			sample_group_name = sample_group_info.grouping_type.trim()+"/"+sample_group_info.grouping_type_parameter;
			html += getShowHidePropertyCheckbox(sample_group_name);
		}
	}
	html += "</div>";

	html += "<table>";
	html += "<thead>";
	html += "<tr>";
	for (prop in properties) {
		html += "<th class='stbl_"+properties[prop]+"'>"+properties[prop]+"</th>";
	}
	if (trak && trak.sample_groups_info) {
		//html += "<th>Groups</th>";
		for (j in trak.sample_groups_info) {
			sample_group_info = trak.sample_groups_info[j];
			sample_group_name = sample_group_info.grouping_type.trim()+"/"+sample_group_info.grouping_type_parameter;
			html += "<th class='stbl_"+sample_group_name.replace('/','_')+"'>Sample Group '"+sample_group_name+"'</th>";
		}
	}
	if (trak.mdia.minf.stbl.subs || trak.has_fragment_subsamples) {
		html += "<th class='stbl_subsamples'>subsamples</th>";
	}
	html += "</tr>";
	html += "</thead>";
	html += "<tbody>";

	samples = file.mp4boxfile.getTrackSamplesInfo(track_id);
	if (samples.length < end) end = samples.length;
	for (i = start; i < end; i++) {
		sample = samples[i];
		html += "<tr>";
		for (prop in properties) {
			html += "<td class='stbl_"+properties[prop]+"'>"+sample[properties[prop]];
			if (properties[prop] == "cts" || properties[prop] == "dts") {
				html += " - "+Log.getDurationString(sample[properties[prop]], sample.timescale);
			}
			html += "</td>";
		}
		if (sample.sample_groups) {
			for (j in sample.sample_groups) {
				sample_group_info = sample.sample_groups[j];
				if (sample_group_info) {
					sample_group_name = sample_group_info.grouping_type.trim()+"/"+sample_group_info.grouping_type_parameter;
					html += "<td class='stbl_"+sample_group_name.replace('/','_')+"'>";
					if (sample_group_info.description) {
						html += generateBoxTable(sample_group_info.description, [ "data", "description_length", "grouping_type"], undefined, true);
					}
					html += "</td>";
				}
			}
		}
		if (trak.mdia.minf.stbl.subs || trak.has_fragment_subsamples) {
			html += "<td class='stbl_subsamples'>";
			if (sample.subsamples) {
				for (j = 0; j < sample.subsamples.length; j++) {
					html += generateBoxTable(sample.subsamples[j], [], [], true);
				}
			}
			html += "</td>";
		}
		html += "</tr>";
	}
	html += "</tbody>";
	html += "</table>";
	$("#sampletable").html(html);
}

window.onload = function () {

	createLoadBar($('#menubar'), "File", "file", file, finalizeAnalyzerUI);

	createFancyTree($('#boxtreeview'), file);

	$("#resulttabs").tabs();
	$("#boxview").tabs();
	$("#sampleviewselector").selectmenu({
		width: 200,
		change: function(e) {
			switch(e.target.selectedOptions[0].value) {
				case "Sample Table":
					$("#sampletable").show();
					$("#samplegraph").hide();
					$("#samplemap").hide();
					$("#sampletimeline").hide();
					break;
				case "Sample Graph":
					$("#sampletable").hide();
					$("#samplegraph").show();
					$("#samplemap").hide();
					$("#sampletimeline").hide();
					break;
				case "Sample Map":
					$("#sampletable").hide();
					$("#samplegraph").hide();
					$("#samplemap").show();
					$("#sampletimeline").hide();
					break;
				case "Sample Timeline":
					$("#sampletable").hide();
					$("#samplegraph").hide();
					$("#samplemap").hide();
					$("#sampletimeline").show();
					break;
			}
		}
	});
	$("#sampletable").show();
	$("#samplegraph").hide();
	$("#samplemap").hide();
	$("#sampletimeline").hide();

	if (window.location.search) {
		file.objectToLoad = window.location.search.substring(1);
		load();
	}
}

function displayItemContent(id) {
	var string;
	var item = file.mp4boxfile.getItem(id);
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
	//file.mp4boxfile.releaseItem(id);
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
	var info = file.mp4boxfile.getInfo();
	var all = [];
	var samples, s;
	var i, j;

	for (i = 0; i < info.tracks.length; i++) {
		samples = file.mp4boxfile.getTrackSamplesInfo(info.tracks[i].id);
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
    	sample_tooltip += '  Sync:\t\t'+s.is_sync+'\n';
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

SampleTimeline.prototype.update = function() {
  	var that = this;
	var data = this.data;
	if (!data || data.length === 0) {
		return;
	}
	var scale = (data[0].duration ? 50/data[0].duration : 50);
	var sample_height = 30;
	var height_spacing = 10;
	var x_offset = 100;
	this.svg.html('');
	this.svg.append('text').attr('x', 0)
						   .attr('y', sample_height/2)
						   .text('Decoding');
	this.svg.append('text').attr('x', 0)
						   .attr('y', sample_height)
						   .text('Timeline');
	this.svg.append('text').attr('x', 0)
						   .attr('y', 3*sample_height/2+height_spacing)
						   .text('Composition');
	this.svg.append('text').attr('x', 0)
						   .attr('y', 2*sample_height+height_spacing)
						   .text('Timeline');
	this.svg.append('defs').append('marker').attr('id','arrow')
											.attr('markerWidth',13)
											.attr('markerHeight',13)
											.attr('refX',2)
											.attr('refY',6)
											.attr('orient',"auto")
											.append("path").attr("d","M2,2 L2,11 L10,6 L2,2").attr("fill","black");
	var dts_offset = data[0].dts;
	data.forEach(function(d, i) {
    	var sampleg = that.svg.append('g').attr('transform', 'translate('+x_offset+')');
    	sampleg.append('rect').attr('x', (d.dts-dts_offset)*scale)
    						  .attr('y', 0)
    						  .attr('width', d.duration*scale)
    						  .attr('height', sample_height)
    						  .style('fill', 'red')
    						  .style('stroke', (d.is_sync?'black':'none'));
	    sampleg.append("text")
	        .attr("text-anchor", "middle")
			.attr("dominant-baseline", "central")
	    	.attr("x", (d.dts-dts_offset+d.duration/2)*scale)
	    	.attr("y", sample_height/2)
	    	.text(d.dts);
    	sampleg.append('rect').attr('x', (d.cts-dts_offset)*scale)
    						  .attr('y', sample_height+height_spacing)
    						  .attr('width', d.duration*scale)
    						  .attr('height', sample_height)
    						  .style('fill', 'blue')
    						  .style('stroke', (d.is_sync?'black':'none'));
	    sampleg.append("text")
	        .attr("text-anchor", "middle")
			.attr("dominant-baseline", "central")
	    	.attr("x", (d.cts-dts_offset+d.duration/2)*scale)
	    	.attr("y", sample_height+height_spacing+sample_height/2)
	    	.text(d.cts);
    	sampleg.append('line').attr('x1', (d.dts-dts_offset+d.duration/2)*scale)
    						  .attr('y1', sample_height)
    						  .attr('x2', (d.cts-dts_offset+d.duration/2)*scale)
    						  .attr('y2', sample_height+height_spacing)
    						  .attr('stroke-width', '1px')
    						  .attr('marker-end','url(#arrow)')
    						  .style('stroke','black');
  	});
}

function SampleTimeline() {
	var margin = {top: 10, right: 10, bottom: 80, left: 20};
    var width = this.width = document.body.clientWidth - margin.left - margin.right;
    var height = this.height = window.innerHeight - margin.top - margin.bottom;

	var div = d3.select("#sampletimeline");
	div.html('');
	this.svg = div.append("svg")
		.attr("width", "100%")
		.attr("height", "100%")
	    .attr("viewBox", "0 0 "+(width + margin.left + margin.right)+" "+(height + margin.top + margin.bottom))
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
}

SampleGraph.prototype.update = function () {
  	var that = this;
	var data = this.data;
	if (!data || data.length === 0) {
		return;
	}
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
	  	if (l.domain[0] === l.domain[1]) {
	  		l.domain[0]--;
	  		l.domain[1]++;
	  	}
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
    var height = this.height = window.innerHeight - margin.top - margin.bottom;

  	function DrawableLine(name, color, legend, visible) {
  		this.visible = visible;
  		this.legend = legend;
  		this.name = name;
  		this.color = color;
		this.range = d3.scale.linear().range([height, 0]);
		this.axis = d3.svg.axis().scale(this.range).tickSize(1).orient("left").tickFormat(d3.format("d"));
  	}

  	var xaxisChoice = this.xaxisChoice = "number";
  	this.lines = [
	  	new DrawableLine("dts", "purple", "DTS (timescale)", false),
	  	new DrawableLine("cts", "black", "CTS (timescale)", false),
	  	new DrawableLine("size", "blue", "Size (bytes)", true),
	  	new DrawableLine("ctso", "red", "CTS Offset (timescale)", false),
	  	new DrawableLine("duration", "green", "Duration (timescale)", false),
	  	new DrawableLine("is_sync", "orange", "RAP (boolean)", false),
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
	this.xAxis = d3.svg.axis().scale(this.x).orient("bottom").tickSize(1).tickFormat(d3.format("d"));

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
		.attr("y", 30)
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