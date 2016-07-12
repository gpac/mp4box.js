/* position in the current buffer of the beginning of the last box parsed */
ISOFile.prototype.lastBoxStartPosition = 0;
/* indicator if the parsing is stuck in the middle of an mdat box */
ISOFile.prototype.parsingMdat = null;
/* next file position that the parser needs:
    - 0 until the first buffer (i.e. fileStart ===0) has been received 
    - otherwise, the next box start until the moov box has been parsed
    - otherwise, the position of the next sample to fetch
 */
ISOFile.prototype.nextParsePosition = 0;
/* keep mdat data */
ISOFile.prototype.discardMdatData = false;

ISOFile.prototype.processIncompleteBox = function(ret) {
	var box;
	var merged;
	var found;
	
	/* we did not have enough bytes in the current buffer to parse the entire box */
	if (ret.type === "mdat") { 
		/* we had enough bytes to get its type and size and it's an 'mdat' */
		
		/* special handling for mdat boxes, since we don't actually need to parse it linearly 
		   we create the box */
		box = new BoxParser[ret.type+"Box"](ret.size);	
		this.parsingMdat = box;
		this.boxes.push(box);
		this.mdats.push(box);			
		box.start = ret.start;
		box.hdr_size = ret.hdr_size;
		this.stream.addUsedBytes(box.hdr_size);

		/* indicate that the parsing should start from the end of the box */
		this.lastBoxStartPosition = box.start + box.size;
 		/* let's see if we have the end of the box in the other buffers */
		found = this.stream.seek(box.start + box.size, false, this.discardMdatData);
		if (found) {
			/* found the end of the box */
			this.parsingMdat = null;
			/* let's see if we can parse more in this buffer */
			return true;
		} else {
			/* 'mdat' end not found in the existing buffers */
			/* determine the next position in the file to start parsing from */
			if (!this.moovStartFound) {
				/* moov not find yet, 
				   the file probably has 'mdat' at the beginning, and 'moov' at the end, 
				   indicate that the downloader should not try to download those bytes now */
				this.nextParsePosition = box.start + box.size;
			} else {
				/* we have the start of the moov box, 
				   the next bytes should try to complete the current 'mdat' */
				this.nextParsePosition = this.stream.findEndContiguousBuf();
			}
			/* not much we can do, wait for more buffers to arrive */
			return false;
		}
	} else {
		/* box is incomplete, we may not even know its type */
		if (ret.type === "moov") { 
			/* the incomplete box is a 'moov' box */
			this.moovStartFound = true;
			if (this.mdats.length === 0) {
				this.isProgressive = true;
			}
		}
		/* either it's not an mdat box (and we need to parse it, we cannot skip it)
		   (TODO: we could skip 'free' boxes ...)
			   or we did not have enough data to parse the type and size of the box, 
		   we try to concatenate the current buffer with the next buffer to restart parsing */
		merged = (this.stream.mergeNextBuffer ? this.stream.mergeNextBuffer() : false);
		if (merged) {
			/* The next buffer was contiguous, the merging succeeded,
			   we can now continue parsing, 
			   the next best position to parse is at the end of this new buffer */
			this.nextParsePosition = this.stream.getEndPosition();
			return true;
		} else {
			/* we cannot concatenate existing buffers because they are not contiguous or because there is no additional buffer */
			/* The next best position to parse is still at the end of this old buffer */
			if (!ret.type) {
				/* There were not enough bytes in the buffer to parse the box type and length,
				   the next fetch should retrieve those missing bytes, i.e. the next bytes after this buffer */
				this.nextParsePosition = this.stream.getEndPosition();
			} else {
				/* we had enough bytes to parse size and type of the incomplete box
				   if we haven't found yet the moov box, skip this one and try the next one 
				   if we have found the moov box, let's continue linear parsing */
				if (this.moovStartFound) {
					this.nextParsePosition = this.stream.getEndPosition();
				} else {
					this.nextParsePosition = this.stream.getPosition() + ret.size;
				}
			}
			return false;
		}
	}
}

ISOFile.prototype.hasIncompleteMdat = function () {
	return (this.parsingMdat !== null);
}

ISOFile.prototype.processIncompleteMdat = function () {
	var box;
	var found;
	
	/* we are in the parsing of an incomplete mdat box */
	box = this.parsingMdat;

	found = this.stream.seek(box.start + box.size, false, this.discardMdatData);
	if (found) {
		Log.debug("ISOFile", "Found 'mdat' end in buffered data");
		/* the end of the mdat has been found */ 
		this.parsingMdat = null;
		/* we can parse more in this buffer */
		return true;
	} else {
		/* we don't have the end of this mdat yet, 
		   indicate that the next byte to fetch is the end of the buffers we have so far, 
		   return and wait for more buffer to come */
		this.nextParsePosition = this.stream.findEndContiguousBuf();
		return false;
	}
}

ISOFile.prototype.restoreParsePosition = function() {
	/* Reposition at the start position of the previous box not entirely parsed */
	return this.stream.seek(this.lastBoxStartPosition, true, this.discardMdatData);
}

ISOFile.prototype.saveParsePosition = function() {
	/* remember the position of the box start in case we need to roll back (if the box is incomplete) */
	this.lastBoxStartPosition = this.stream.getPosition();	
}

ISOFile.prototype.updateUsedBytes = function(box, ret) {
	if (this.stream.addUsedBytes) {
		if (box.type === "mdat") {
			/* for an mdat box, only its header is considered used, other bytes will be used when sample data is requested */
			this.stream.addUsedBytes(box.hdr_size);
			if (this.discardMdatData) {
				this.stream.addUsedBytes(box.size-box.hdr_size);
			}
		} else {
			/* for all other boxes, the entire box data is considered used */
			this.stream.addUsedBytes(box.size);
		}	
	}
}
