var OSisLittleEndian=false;
var BitBuffer = {
	MAIN_8: 0x20, 
	MAIN_10: 0x22, 
	HIGH_8: 0x30, 
	HIGH_10: 0x32,

	_buffer: [],
	_buffer_size: 0,

	load: function(data, read_only) {
		this._buffer = data;
		this._buffer_size = data.length;
		this._big_endian = true;
		this._read_error = this._write_error = false;

		this._state={};
		this._state.read_only = read_only | false;
		this._state.rbyte = 0;
		this._state.rbit = 0;
		this._state.end = this._state.wbyte = this._buffer_size;
		this._state.wbit = 0;
	},
	getBit: function() {
		if (this._read_error || this.endOfRead()) {
			this._read_error = true;
			return 0;
		}

		var bit = (this._buffer[this._state.rbyte] >> (this._big_endian ? (7 - this._state.rbit) : this._state.rbit)) & 0x01;
		if (++this._state.rbit > 7) {
			this._state.rbyte++;
			this._state.rbit = 0;
		}
		return bit;
	},
	endOfRead: function() {
		return this._state.rbyte == this._state.wbyte && this._state.rbit == this._state.wbit;
	},
	getBool: function() {
		return this.getBit() != 0;
	},
	rdb: function(bytes) {
		var i, res, ff=0xFFFFFFFFFFFFFFFF;
		if (this._read_error)
			return ff;
		if (this._state.rbit==0) {
			// Read buffer is byte aligned. Most common case.
			if (this._state.rbyte + bytes > this._state.wbyte) {
				// Not enough bytes to read.
				this._read_error = true;
				return ff;
			}
			else {
				for (res=0, i=0; i<bytes; i++)
					res = (res << 8) + this._buffer[this._state.rbyte+i];
				this._state.rbyte += bytes;
				return res;
			}
		}
		else {
			// Read buffer is not byte aligned, use an intermediate aligned buffer.
			if (this.currentReadBitOffset() + (8 * bytes) > this.currentWriteBitOffset()) {
				// Not enough bytes to read.
				this._read_error = true;
				return ff;
			}
			else {
				for (res=0, i=0; i<bytes; i++) {
					if (this._big_endian)
						res = (res << 8) + ((this._buffer[this._state.rbyte] << this._state.rbit) | (this._buffer[this._state.rbyte + 1] >> (8 - this._state.rbit)));
					else
						res = (res << 8) + ((_buffer[_state.rbyte] >> _state.rbit) | (_buffer[_state.rbyte + 1] << (8 - _state.rbit)));
					this._state.rbyte++;
				}
				return res;
			}
		}
	},
	currentReadByteOffset: function() {return this._state.rbyte;},
	currentReadBitOffset: function() {return 8 * this._state.rbyte + this._state.rbit;},
	currentWriteByteOffset: function() {return this._state.wbyte;},
	currentWriteBitOffset: function() {return 8 * this._state.wbyte + this._state.wbit;},

	getUint8: function() {
		return this.rdb(1);
	},

	getUint16: function() {
		return this._big_endian ? this.GetUInt16BE(this.rdb(2)) : this.GetUInt16LE(this.rdb(2));
	},
	ByteSwap16: function(x) {
		return (x << 8) | (x >> 8);
	},
	CondByteSwap16BE: function(val) {
		return OSisLittleEndian ? this.ByteSwap16(val) : val;
	},
	CondByteSwap16LE: function(val) {
		return OSisLittleEndian ? val : this.ByteSwap16(val);
	},
	GetUInt16BE: function(val) {
		return this.CondByteSwap16BE(val);
	},
	GetUInt16LE: function(val) {
		return this.CondByteSwap16LE(val);
	},
	
	getUint32: function() {
		return this._big_endian ? this.GetUInt32BE(this.rdb(4)) : this.GetUInt32LE(this.rdb(4));
	},
	ByteSwap32: function(x) {
		return (x << 24) | ((x << 8) & 0x00FF0000) | ((x >> 8) & 0x0000FF00) | (x >> 24);
	},
	CondByteSwap32BE: function(val) {
		return OSisLittleEndian ? this.ByteSwap32(val) : val;
	},
	CondByteSwap32LE: function(val) {
		return OSisLittleEndian ? val : this.ByteSwap32(val);
	},
	GetUInt32BE: function(val) {
		return this.CondByteSwap32BE(val);
	},
	GetUInt32LE: function(val) {
		return this.CondByteSwap32LE(val);
	},

	getBits: function(bits) {
		// No read if read error is already set or not enough bits to read.
		if (this._read_error || this.currentReadBitOffset() + bits > this.currentWriteBitOffset()) {
			this._read_error = true;
			return 0;
		}
		var val = 0;
		if (this._big_endian) {
			// Read leading bits up to byte boundary
			while (bits > 0 && this._state.rbit != 0) {
				val = (val << 1) | this.getBit();
				--bits;
			}

			// Read complete bytes
			while (bits > 7) {
				val = (val << 8) | this._buffer[this._state.rbyte++];
				bits -= 8;
			}

			// Read trailing bits
			while (bits > 0) {
				val = (val << 1) | this.getBit();
				--bits;
			}
		}
		else {
			// Little endian decoding
			var shift = 0;

			// Read leading bits up to byte boundary
			while (bits > 0 && this._state.rbit != 0) {
				val |= (this.getBit() << shift);
				--bits;
				shift++;
			}

			// Read complete bytes
			while (bits > 7) {
				val |= this._buffer[this._state.rbyte++] << shift;
				bits -= 8;
				shift += 8;
			}

			// Read trailing bits
			while (bits > 0) {
				val |= (this.getBit() << shift);
				--bits;
				shift++;
			}
		}
		return (val);
	},
	skipBits: function(bits) {
		if (this._read_error) {
			// Can't skip bits and bytes if read error is already set.
			return false;
		}
		var rpos = 8 * this._state.rbyte + this._state.rbit + bits;
		var wpos = 8 * this._state.wbyte + this._state.wbit;
		if (rpos > wpos) {
			this._state.rbyte = this._state.wbyte;
			this._state.rbit = this._state.wbit;
			this._read_error = true;
			return false;
		}
		else {
			this._state.rbyte = rpos >> 3;
			this._state.rbit = rpos & 7;
			return true;
		}
	}
};


BoxParser.createBoxCtor("av3c", function(stream) {
	var i, tmp_byte, sequence_header_length;

	var binForm = function (value, bits) {
		var _i, res = "b";
		for (_i=bits; _i>0; _i--)
			res += (value & (1 << (_i-1)) ? "1" : "0");
		return res;
	};
	this.configurationVersion = stream.readUint8();
	sequence_header_length = stream.readUint16();

	var buf=[];
	for (i=0; i<sequence_header_length; i++) {
		buf.push(stream.readUint8());
	}
	BitBuffer.load(buf, false);

	tmp_byte = BitBuffer.getUint32();   // video_sequence_start_code
	this.profile_id = BitBuffer.getUint8();
	this.level_id = BitBuffer.getUint8();
	this.progressive_sequence = BitBuffer.getBit();
	this.field_coded_sequence = BitBuffer.getBit();
	this.library_stream_flag = BitBuffer.getBit();
	if (!this.library_stream_flag) {
		this.library_picture_enable_flag = BitBuffer.getBit();
		if (this.library_picture_enable_flag)
			this.duplicate_sequence_number_flag = BitBuffer.getBit();
	}
	BitBuffer.skipBits(1);  // marker_bit

	this.horizontal_size = BitBuffer.getBits(14);
	BitBuffer.skipBits(1);  // marker_bit

	this.vertical_size = BitBuffer.getBits(14);
	this.chroma_format = binForm(BitBuffer.getBits(2), 2);
	this.sample_precision = binForm(BitBuffer.getBits(3), 3);
	if (this.profile_id == MAIN_10 || this.profile_id == HIGH_10)
		this.encoding_precision = binForm(BitBuffer.getBits(3), 3);
	BitBuffer.skipBits(1);  // marker_bit

	this.aspect_ratio = binForm(BitBuffer.getBits(4), 4);
	this.frame_rate_code = binForm(BitBuffer.getBits(4), 4);
	BitBuffer.skipBits(1);  // marker_bit

	this.bit_rate_lower = BitBuffer.getBits(18);
	BitBuffer.skipBits(1);  // marker_bit

	this.bit_rate_upper = BitBuffer.getBits(12);
	this.low_delay = BitBuffer.getBit();
	this.temporal_id_enable_flag = BitBuffer.getBit();
	BitBuffer.skipBits(1);  // marker_bit

	this.bbv_buffer_size = BitBuffer.getBits(18);
	BitBuffer.skipBits(1);  // marker_bit

	this.max_dpb_minus1 = BitBuffer.getBits(4);
	// other sequence_header() elements are only useful for detailed debugging

	this.library_dependency_idc = binForm(stream.readUint8(), 2);
});

