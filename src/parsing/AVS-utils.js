/*
* Copyright (c) 2024. Paul Higgs
* License: BSD-3-Clause (see LICENSE file)
*/

function HexadecimalValue(value, description) {
    this.value = value;
    this.description = description === undefined ? null : description;
}
HexadecimalValue.prototype.toString = function() {
    return "0x" + this.value.toString(16) + 
           (this.description ? " (" + this.description + ")" : "");
}
HexadecimalValue.prototype.getValue = function() {
    return this.value;
}


function BinaryValue(value, bits) {
    this.value = value;
    this.bits = bits;
}
BinaryValue.prototype.toString = function() {
    var i, res = "b";
    for (i=this.bits; i>0; i--)
        res += (this.value & (1 << (i-1)) ? "1" : "0");
    return res;
};

function DescribedValue(value, descriptionFunc) {
    this.value = value;
    this.description = (typeof descriptionFunc == "function") ? descriptionFunc(value) : null;
}
DescribedValue.prototype.toString = function() {
    return this.value + (this.description ? " (" + this.description + ")" : "");
}


/**
 * reads bits and bytes from a buffer that may not contain aligned values
 */
function phBitBuffer(stream) {
    var isLocalBigEndian = function () {
        var buf = new ArrayBuffer(4);
        var u32data = new Uint32Array(buf);
        var u8data = new Uint8Array(buf);
        u32data[0] = 0xcafebabe;
        return u8data[0] === 0xca;
    };
    var OSisLittleEndian = !isLocalBigEndian();
    var _buffer = [];
    var _buffer_size = 0;

    if (stream != undefined) {
        var stream_length = stream.getLength();
        var i, buf=[];
        for (i=0; i<stream_length; i++)
            buf.push(stream.readUint8());
        this.load(buf, false);
    }
}
phBitBuffer.prototype.load = function(data, read_only) {
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
};
phBitBuffer.prototype.getBit = function() {
    //! Read the next bit and advance the read pointer.
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
};
phBitBuffer.prototype.peekBit = function() {
    //! Read the next bit but don't advance the read pointer.
    if (this._read_error || this.endOfRead()) {
        this._read_error = true;
        return 0;
    }
    var bit = (this._buffer[this._state.rbyte] >> (this._big_endian ? (7 - this._state.rbit) : this._state.rbit)) & 0x01;
    return bit;
};
phBitBuffer.prototype.endOfRead =  function() {
    return this._state.rbyte == this._state.wbyte && this._state.rbit == this._state.wbit;
};
phBitBuffer.prototype.getBool = function() {
    return this.getBit() != 0;
};
phBitBuffer.prototype.rdb = function(bytes) {
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
};
phBitBuffer.prototype.currentReadByteOffset = function() {return this._state.rbyte;};
phBitBuffer.prototype.currentReadBitOffset = function() {return 8 * this._state.rbyte + this._state.rbit;};
phBitBuffer.prototype.currentWriteByteOffset = function() {return this._state.wbyte;};
phBitBuffer.prototype.currentWriteBitOffset = function() {return 8 * this._state.wbyte + this._state.wbit;};
phBitBuffer.prototype.getUint8 =  function() { return this.rdb(1); };

phBitBuffer.prototype.getUint16 = function() {
    return this._big_endian ? this.GetUInt16BE(this.rdb(2)) : this.GetUInt16LE(this.rdb(2));
};
phBitBuffer.prototype.ByteSwap16 = function(x) { return (x << 8) | (x >> 8); };
phBitBuffer.prototype.CondByteSwap16BE = function(val) { return this.OSisLittleEndian ? this.ByteSwap16(val) : val; };
phBitBuffer.prototype.CondByteSwap16LE = function(val) { return this.OSisLittleEndian ? val : this.ByteSwap16(val); };
phBitBuffer.prototype.GetUInt16BE = function(val) { return this.CondByteSwap16BE(val); };
phBitBuffer.prototype.GetUInt16LE = function(val) { return this.CondByteSwap16LE(val); };


phBitBuffer.prototype.getUint24 = function() { return this._big_endian ? this.GetUInt24BE(this.rdb(3)) : this.GetUInt24LE(this.rdb(3)); };
phBitBuffer.prototype.ByteSwap24 = function(x) { return ((x & 0xFF0000) >> 16) | (x & 0xFF00) | (x & 0xFF << 16); };
phBitBuffer.prototype.CondByteSwap24BE = function(val) { return this.OSisLittleEndian ? this.ByteSwap24(val) : val; };
phBitBuffer.prototype.CondByteSwap24LE = function(val) { return this.OSisLittleEndian ? val : this.ByteSwap24(val); };
phBitBuffer.prototype.GetUInt24BE = function(val) { return this.CondByteSwap24BE(val); };
phBitBuffer.prototype.GetUInt24LE =function(val) { return this.CondByteSwap24LE(val); };

phBitBuffer.prototype.getUint32 = function() { return this._big_endian ? this.GetUInt32BE(this.rdb(4)) : this.GetUInt32LE(this.rdb(4)); };
phBitBuffer.prototype.ByteSwap32 = function(x) { return (x << 24) | ((x << 8) & 0x00FF0000) | ((x >> 8) & 0x0000FF00) | (x >> 24); };
phBitBuffer.prototype.CondByteSwap32BE = function(val) { return this.OSisLittleEndian ? this.ByteSwap32(val) : val; };
phBitBuffer.prototype.CondByteSwap32LE = function(val) { return this.OSisLittleEndian ? val : this.ByteSwap32(val); };
phBitBuffer.prototype.GetUInt32BE = function(val) { return this.CondByteSwap32BE(val); };
phBitBuffer.prototype.GetUInt32LE =function(val) { return this.CondByteSwap32LE(val); };
      
phBitBuffer.prototype.getBits = function(bits) {
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
};
phBitBuffer.prototype.skipBits = function(bits) {
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
};

phBitBuffer.prototype.getUE = function() {
    // read in an unsigned Exp-Golomb code;

    if (this.getBit() == 1)
        return 0;
    else {
        var zero_count=1;
        while (this.peekBit() == 0) {
            this.getBit();
            zero_count++;
        }
        var tmp_value = this.getBits(zero_count+1);
        return tmp_value - 1;
    }
};

phBitBuffer.prototype.byte_alignment = function() {
    while ( !this._read_error && this._state.rbit != 0)
        this.skipBit();
}
