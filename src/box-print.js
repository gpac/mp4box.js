/* 
 * Copyright (c) Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
BoxParser.Box.prototype.printHeader = function(output) {
	this.size += 8;
	if (this.size > MAX_SIZE) {
		this.size += 8;
	}
	if (this.type === "uuid") {
		this.size += 16;
	}
	output.log(output.indent+"size:"+this.size);
	output.log(output.indent+"type:"+this.type);
}

BoxParser.FullBox.prototype.printHeader = function(output) {
	this.size += 4;
	BoxParser.Box.prototype.printHeader.call(this, output);
	output.log(output.indent+"version:"+this.version);
	output.log(output.indent+"flags:"+this.flags);
}

BoxParser.Box.prototype.print = function(output) {
	this.printHeader(output);
}

BoxParser.ContainerBox.prototype.print = function(output) {
	this.printHeader(output);
	for (var i=0; i<this.boxes.length; i++) {
		if (this.boxes[i]) {
			var prev_indent = output.indent;
			output.indent += " ";
			this.boxes[i].print(output);
			output.indent = prev_indent;
		}
	}
}

ISOFile.prototype.print = function(output) {
	output.indent = "";
	for (var i=0; i<this.boxes.length; i++) {
		if (this.boxes[i]) {
			this.boxes[i].print(output);
		}
	}	
}

BoxParser.mvhdBox.prototype.print = function(output) {
	BoxParser.FullBox.prototype.printHeader.call(this, output);
	output.log("creation_time: "+this.creation_time);
	output.log("modification_time: "+this.modification_time);
	output.log("timescale: "+this.timescale);
	output.log("duration: "+this.duration);
	output.log("rate: "+this.rate);
	output.log("volume: "+this.volume>>8);
	output.log("matrix: "+this.matrix.join(", "));
	output.log("next_track_id: "+this.next_track_id);
}

BoxParser.tkhdBox.prototype.print = function(output) {
	BoxParser.FullBox.prototype.printHeader.call(this, output);
	output.log("creation_time: "+this.creation_time);
	output.log("modification_time: "+this.modification_time);
	output.log("track_id: "+this.track_id);
	output.log("duration: "+this.duration);
	output.log("volume: "+this.volume>>8);
	output.log("matrix: "+this.matrix.join(", "));
	output.log("layer: "+this.layer);
	output.log("alternate_group: "+this.alternate_group);
	output.log("width: "+this.width);
	output.log("height: "+this.height);
}