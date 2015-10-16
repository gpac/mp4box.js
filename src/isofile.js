/* 
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var ISOFile = function (stream) {
	/* MutiBufferStream object used to parse boxes */
	this.stream = stream;
	/* Array of all boxes (in order) found in the file */
	this.boxes = [];
	/* Array of all mdats */
	this.mdats = [];
	/* Array of all moofs */
	this.moofs = [];
	/* Boolean indicating if the file is compatible with progressive parsing (moov first) */
	this.isProgressive = false;
	/* Boolean used to fire moov start event only once */
	this.moovStartFound = false;
}

ISOFile.prototype.parse = function() {
	var found;
	var ret;
	var box;
	var parseBoxHeadersOnly = false;

	if (this.restoreParsePosition)	{
		if (!this.restoreParsePosition()) {
			return;
		}
	}

	while (true) {
		
		if (this.hasIncompleteMdat && this.hasIncompleteMdat()) {
			if (this.processIncompleteMdat()) {
				continue;
			} else {
				return;
			}
		} else {
			if (this.saveParsePosition)	{
				this.saveParsePosition();
			}
			ret = BoxParser.parseOneBox(this.stream, parseBoxHeadersOnly);
			if (ret.code === BoxParser.ERR_NOT_ENOUGH_DATA) {		
				if (this.processIncompleteBox) {
					if (this.processIncompleteBox(ret)) {
						continue;
					} else {
						return;
					}
				} else {
					return;
				}
			} else {
				/* the box is entirely parsed */
				box = ret.box;
				/* store the box in the 'boxes' array to preserve box order (for file rewrite if needed)  */
				this.boxes.push(box);
				/* but also store box in a property for more direct access */
				switch (box.type) {
					case "mdat":
						this.mdats.push(box);
						break;
					case "moof":
						this.moofs.push(box);
						break;
					case "moov":					
						this.moovStartFound = true;
						if (this.mdats.length === 0) {
							this.isProgressive = true;
						}
						/* no break */
						/* falls through */
					default:
						if (this[box.type] !== undefined) {
							Log.warn("ISOFile", "Duplicate Box of type: "+box.type+", overriding previous occurrence");
						}
						this[box.type] = box;
						break;
				}
				if (this.updateUsedBytes) {
					this.updateUsedBytes(box, ret);					
				}
			}
		}
	}
}

/* Find and return specific boxes using recursion and early return */
ISOFile.prototype.getBox = function(type) {
  var result = this.getBoxes(type, true);
  return (result.length ? result[0] : null);  
}

ISOFile.prototype.getBoxes = function(type, returnEarly) {
  var result = [];
  ISOFile._sweep.call(this, type, result, returnEarly);
  return result;
}

ISOFile._sweep = function(type, result, returnEarly) {
  if (this.type && this.type == type) result.push(this);
  for (var box in this.boxes) {
    if (result.length && returnEarly) return;
    ISOFile._sweep.call(this.boxes[box], type, result, returnEarly);
  }
}

if (typeof exports !== 'undefined') {
	exports.ISOFile = ISOFile;	
}
