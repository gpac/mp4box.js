/**
 * MultiBufferStream is a class that acts as a SimpleStream for parsing 
 * It holds several, possibly non-contiguous ArrayBuffer objects, each with a fileStart property 
 * containing the offset for the buffer data in an original/virtual file 
 *
 * It inherits also from DataStream for all read/write/alloc operations
 */

/**
 * Constructor
 */
var MultiBufferStream = function(buffer) {
	/* List of ArrayBuffers, with a fileStart property, sorted in fileStart order and non overlapping */
	this.buffers = [];	
	this.bufferIndex = -1;
	if (buffer) {
		this.insertBuffer(buffer);
		this.bufferIndex = 0;
	}
}
MultiBufferStream.prototype = new DataStream(new ArrayBuffer(), 0, DataStream.BIG_ENDIAN);

/************************************************************************************
  Methods for the managnement of the buffers (insertion, removal, concatenation, ...)
 ***********************************************************************************/

MultiBufferStream.prototype.initialized = function() {
	var firstBuffer;
	if (this.bufferIndex > -1) {
		return true;
	} else if (this.buffers.length > 0) {
		firstBuffer = this.buffers[0];
		if (firstBuffer.fileStart === 0) {
			this.buffer = firstBuffer;
			this.bufferIndex = 0;
			Log.debug("MultiBufferStream", "Stream ready for parsing");
			return true;
		} else {
			Log.warn("MultiBufferStream", "The first buffer should have a fileStart of 0");
			this.logBufferLevel();
			return false;
		}
	} else {
		Log.warn("MultiBufferStream", "No buffer to start parsing from");
		this.logBufferLevel();
		return false;
	}			
}

/**
 * helper functions to concatenate two ArrayBuffer objects
 * @param  {ArrayBuffer} buffer1 
 * @param  {ArrayBuffer} buffer2 
 * @return {ArrayBuffer} the concatenation of buffer1 and buffer2 in that order
 */
ArrayBuffer.concat = function(buffer1, buffer2) {
  Log.debug("ArrayBuffer", "Trying to create a new buffer of size: "+(buffer1.byteLength + buffer2.byteLength));
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

/**
 * Reduces the size of a given buffer, but taking the part between offset and offset+newlength
 * @param  {ArrayBuffer} buffer    
 * @param  {Number}      offset    the start of new buffer
 * @param  {Number}      newLength the length of the new buffer
 * @return {ArrayBuffer}           the new buffer
 */
MultiBufferStream.prototype.reduceBuffer = function(buffer, offset, newLength) {
	var smallB;
	smallB = new Uint8Array(newLength);
	smallB.set(new Uint8Array(buffer, offset, newLength));
	smallB.buffer.fileStart = buffer.fileStart+offset;
	smallB.buffer.usedBytes = 0;
	return smallB.buffer;	
}

/**
 * Inserts the new buffer in the sorted list of buffers,
 *  making sure, it is not overlapping with existing ones (possibly reducing its size).
 *  if the new buffer overrides/replaces the 0-th buffer (for instance because it is bigger), 
 *  updates the DataStream buffer for parsing 
*/
MultiBufferStream.prototype.insertBuffer = function(ab) {	
	var to_add = true;
	/* TODO: improve insertion if many buffers */
	for (var i = 0; i < this.buffers.length; i++) {
		var b = this.buffers[i];
		if (ab.fileStart <= b.fileStart) {
			/* the insertion position is found */
			if (ab.fileStart === b.fileStart) {
				/* The new buffer overlaps with an existing buffer */
				if (ab.byteLength >  b.byteLength) {
					/* the new buffer is bigger than the existing one
					   remove the existing buffer and try again to insert 
					   the new buffer to check overlap with the next ones */
					this.buffers.splice(i, 1);
					i--; 
					continue;
				} else {
					/* the new buffer is smaller than the existing one, just drop it */
					Log.warn("MultiBufferStream", "Buffer (fileStart: "+ab.fileStart+" - Length: "+ab.byteLength+") already appended, ignoring");
				}
			} else {
				/* The beginning of the new buffer is not overlapping with an existing buffer
				   let's check the end of it */
				if (ab.fileStart + ab.byteLength <= b.fileStart) {
					/* no overlap, we can add it as is */
				} else {
					/* There is some overlap, cut the new buffer short, and add it*/
					ab = this.reduceBuffer(ab, 0, b.fileStart - ab.fileStart);
				}
				Log.debug("MultiBufferStream", "Appending new buffer (fileStart: "+ab.fileStart+" - Length: "+ab.byteLength+")");
				this.buffers.splice(i, 0, ab);
				/* if this new buffer is inserted in the first place in the list of the buffer, 
				   and the DataStream is initialized, make it the buffer used for parsing */
				if (i === 0) {
					this.buffer = ab;
				}
			}
			to_add = false;
			break;
		} else if (ab.fileStart < b.fileStart + b.byteLength) {
			/* the new buffer overlaps its beginning with the end of the current buffer */
			var offset = b.fileStart + b.byteLength - ab.fileStart;
			var newLength = ab.byteLength - offset;
			if (newLength > 0) {
				/* the new buffer is bigger than the current overlap, drop the overlapping part and try again inserting the remaining buffer */
				ab = this.reduceBuffer(ab, offset, newLength);
			} else {
				/* the content of the new buffer is entirely contained in the existing buffer, drop it entirely */
				to_add = false;
				break;
			}
		}
	}
	/* if the buffer has not been added, we can add it at the end */
	if (to_add) {
		Log.debug("MultiBufferStream", "Appending new buffer (fileStart: "+ab.fileStart+" - Length: "+ab.byteLength+")");
		this.buffers.push(ab);
		/* if this new buffer is inserted in the first place in the list of the buffer, 
		   and the DataStream is initialized, make it the buffer used for parsing */
		if (i === 0) {
			this.buffer = ab;
		}
	}
}

/**
 * Displays the status of the buffers (number and used bytes)
 * @param  {Object} info callback method for display
 */
MultiBufferStream.prototype.logBufferLevel = function(info) {
	var i;
	var buffer;
	var used, total;
	var ranges = [];
	var range;
	var bufferedString = "";
	used = 0;
	total = 0;
	for (i = 0; i < this.buffers.length; i++) {
		buffer = this.buffers[i];
		if (i === 0) {
			range = {};
			ranges.push(range);
			range.start = buffer.fileStart;
			range.end = buffer.fileStart+buffer.byteLength;
			bufferedString += "["+range.start+"-";
		} else if (range.end === buffer.fileStart) {
			range.end = buffer.fileStart+buffer.byteLength;
		} else {
			range = {};
			range.start = buffer.fileStart;
			bufferedString += (ranges[ranges.length-1].end-1)+"], ["+range.start+"-";
			range.end = buffer.fileStart+buffer.byteLength;
			ranges.push(range);
		}
		used += buffer.usedBytes;
		total += buffer.byteLength;
	}
	if (ranges.length > 0) {
		bufferedString += (range.end-1)+"]";
	}
	var log = (info ? Log.info : Log.debug)
	if (this.buffers.length === 0) {
		log("MultiBufferStream", "No more buffer in memory");
	} else {
		log("MultiBufferStream", ""+this.buffers.length+" stored buffer(s) ("+used+"/"+total+" bytes), continuous ranges: "+bufferedString);
	}
}

MultiBufferStream.prototype.cleanBuffers = function () {
	var i;
	var buffer;
	for (i = 0; i < this.buffers.length; i++) {
		buffer = this.buffers[i];
		if (buffer.usedBytes === buffer.byteLength) {
			Log.debug("MultiBufferStream", "Removing buffer #"+i);
			this.buffers.splice(i, 1);
			i--;
		}
	}
}

MultiBufferStream.prototype.mergeNextBuffer = function() {
	var next_buffer;
	if (this.bufferIndex+1 < this.buffers.length) {
		next_buffer = this.buffers[this.bufferIndex+1];
		if (next_buffer.fileStart === this.buffer.fileStart + this.buffer.byteLength) {
			var oldLength = this.buffer.byteLength;
			var oldUsedBytes = this.buffer.usedBytes;
			var oldFileStart = this.buffer.fileStart;
			this.buffers[this.bufferIndex] = ArrayBuffer.concat(this.buffer, next_buffer);
			this.buffer = this.buffers[this.bufferIndex];
			this.buffers.splice(this.bufferIndex+1, 1);
			this.buffer.usedBytes = oldUsedBytes; /* TODO: should it be += ? */
			this.buffer.fileStart = oldFileStart;
			Log.debug("ISOFile", "Concatenating buffer for box parsing (length: "+oldLength+"->"+this.buffer.byteLength+")");
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
}


/*************************************************************************
  Seek-related functions
 *************************************************************************/

/**
 * Finds the buffer that holds the given file position
 * @param  {Boolean} fromStart    indicates if the search should start from the current buffer (false) 
 *                                or from the first buffer (true)
 * @param  {Number}  filePosition position in the file to seek to
 * @param  {Boolean} markAsUsed   indicates if the bytes in between the current position and the seek position 
 *                                should be marked as used for garbage collection
 * @return {Number}               the index of the buffer holding the seeked file position, -1 if not found.
 */
MultiBufferStream.prototype.findPosition = function(fromStart, filePosition, markAsUsed) {
	var i;
	var abuffer = null;
	var index = -1;

	/* find the buffer with the largest position smaller than the given position */
	if (fromStart === true) {
	   /* the reposition can be in the past, we need to check from the beginning of the list of buffers */
		i = 0;
	} else {
		i = this.bufferIndex;
	}

	while (i < this.buffers.length) {
		abuffer = this.buffers[i];
		if (abuffer.fileStart <= filePosition) {
			index = i;
			if (markAsUsed) {
				if (abuffer.fileStart + abuffer.byteLength <= filePosition) {
					abuffer.usedBytes = abuffer.byteLength;	
				} else {
					abuffer.usedBytes = filePosition - abuffer.fileStart;
				}		
				this.logBufferLevel();	
			}
		} else {
			break;
		}
		i++;
	}

	if (index !== -1) {
		abuffer = this.buffers[index];
		if (abuffer.fileStart + abuffer.byteLength >= filePosition) {			
			Log.debug("MultiBufferStream", "Found position in existing buffer #"+index);
			return index;
		} else {
			return -1;
		}
	} else {
		return -1;
	}
}

/**
 * Finds the largest file position contained in a buffer or in the next buffers if they are contiguous (no gap)
 * starting from the given buffer index or from the current buffer if the index is not given
 *
 * @param  {Number} inputindex Index of the buffer to start from
 * @return {Number}            The largest file position found in the buffers
 */
MultiBufferStream.prototype.findEndContiguousBuf = function(inputindex) {
	var i;
	var currentBuf;
	var nextBuf;
	var index = (inputindex !== undefined ? inputindex : this.bufferIndex);
	currentBuf = this.buffers[index];
	/* find the end of the contiguous range of data */
	if (this.buffers.length > index+1) {
		for (i = index+1; i < this.buffers.length; i++) {
			nextBuf = this.buffers[i];
			if (nextBuf.fileStart === currentBuf.fileStart + currentBuf.byteLength) {
				currentBuf = nextBuf;
			} else {
				break;
			}
		}
	}
	/* return the position of last byte in the file that we have */
	return currentBuf.fileStart + currentBuf.byteLength;
}

/**
 * Returns the largest file position contained in the buffers, larger than the given position
 * @param  {Number} pos the file position to start from
 * @return {Number}     the largest position in the current buffer or in the buffer and the next contiguous 
 *                      buffer that holds the given position
 */
MultiBufferStream.prototype.getEndFilePositionAfter = function(pos) {
	var index = this.findPosition(true, pos, false);
	if (index !== -1) {
		return this.findEndContiguousBuf(index);
	} else {
		return pos;
	}
}

/*************************************************************************
  Garbage collection related functions
 *************************************************************************/

/**
 * Marks a given number of bytes as used in the current buffer for garbage collection
 * @param {Number} nbBytes 
 */
MultiBufferStream.prototype.addUsedBytes = function(nbBytes) {
	this.buffer.usedBytes += nbBytes;
	this.logBufferLevel();
}

/**
 * Marks the entire current buffer as used, ready for garbage collection
 */
MultiBufferStream.prototype.setAllUsedBytes = function() {
	this.buffer.usedBytes = this.buffer.byteLength;
	this.logBufferLevel();
}

/*************************************************************************
  Common API between MultiBufferStream and SimpleStream
 *************************************************************************/

/**
 * Tries to seek to a given file position
 * if possible, repositions the parsing from there and returns true 
 * if not possible, does not change anything and returns false 
 * @param  {Number}  filePosition position in the file to seek to
 * @param  {Boolean} fromStart    indicates if the search should start from the current buffer (false) 
 *                                or from the first buffer (true)
 * @param  {Boolean} markAsUsed   indicates if the bytes in between the current position and the seek position 
 *                                should be marked as used for garbage collection
 * @return {Boolean}              true if the seek succeeded, false otherwise
 */
MultiBufferStream.prototype.seek = function(filePosition, fromStart, markAsUsed) {
	var index;
	index = this.findPosition(fromStart, filePosition, markAsUsed);
	if (index !== -1) {
		this.buffer = this.buffers[index];
		this.bufferIndex = index;
		this.position = filePosition - this.buffer.fileStart;
		Log.debug("MultiBufferStream", "Repositioning parser at buffer position: "+this.position);
		return true;
	} else {
		Log.debug("MultiBufferStream", "Position "+filePosition+" not found in buffered data");
		return false;
	}
}

/**
 * Returns the current position in the file
 * @return {Number} the position in the file
 */
MultiBufferStream.prototype.getPosition = function() {
	if (this.bufferIndex === -1 || this.buffers[this.bufferIndex] === null) {
		throw "Error accessing position in the MultiBufferStream";
	}
	return this.buffers[this.bufferIndex].fileStart+this.position;
}

/**
 * Returns the length of the current buffer
 * @return {Number} the length of the current buffer
 */
MultiBufferStream.prototype.getLength = function() {
	return this.byteLength;
}

MultiBufferStream.prototype.getEndPosition = function() {
	if (this.bufferIndex === -1 || this.buffers[this.bufferIndex] === null) {
		throw "Error accessing position in the MultiBufferStream";
	}
	return this.buffers[this.bufferIndex].fileStart+this.byteLength;
}

if (typeof exports !== 'undefined') {
	exports.MultiBufferStream = MultiBufferStream;
}