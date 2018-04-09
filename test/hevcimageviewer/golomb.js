if (typeof require !== 'undefined') {
    var jDataView = require('../lib/jdataview/jdataview.js');
}

var GolombBitStream = function(arrayBuffer) {
    this.dataView = new jDataView(arrayBuffer);

    this.avcGolombBits = [
    8, 7, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0
    ];
}

// Function that encodes a number into a Exp-Golomb code (unsigned order k=0)
GolombBitStream.prototype.numToExpGolomb = function(num) {
    var length = 1;
    var temp = ++num;

    while (temp != 1) {
        temp >>= 1;
        length += 2;
    }
    
    this.dataView.writeUnsigned(0, length >> 1)
    this.dataView.writeUnsigned(num, (length+1) >> 1)
    return (length >> 1) + ((length+1) >> 1);
}

// Function that decodes a Exp-Golomb code (unsigned order k=0) on the stream into a number
GolombBitStream.prototype.expGolombToNum = function(numBits) {
    var coded;
    var bits = 0;
    var read;
    var endTest;
    var oldPos;
    var res;

    while (1) {
        oldPos = this.dataView.tell();
        read = this.dataView.getUnsigned(8);
        this.dataView.seek(oldPos);
        if (read !== 0) break;
        //check whether we still have bits once the peek is done since we may have less than 8 bits available
        try {
            this.dataView.getUnsigned(8);
            bits += 8;
        }
        catch (e) {
            if (e instanceof RangeError) {
                console.log("GolombBitStream.expGolombToNum(): Not enough bits in bitstream.");
                return 0;
            }
        }
    }
    numBits = bits;
    coded = this.avcGolombBits[read];
    this.dataView.getUnsigned(coded);
    numBits += coded;
    bits += coded + 1;
    res = this.dataView.getUnsigned(bits);
    numBits += bits;
    return (res - 1);
}

// Function that decodes a ue7(n) code on the stream into a number
GolombBitStream.prototype.ue7nToNum = function() {
    var res = 0;
    var num;
    var initBit = 1;

    for (var i = 0; initBit; i++) {
        initBit = this.dataView.getUnsigned(1);
        num = this.dataView.getUnsigned(7);
        res = (res * Math.pow(2, 7)) + num;
    }

    return res;
}

// Function that encodes a number into a ue7(n) code on the stream
GolombBitStream.prototype.numToue7n = function(num) {
    var numBitsInit = num.toString(2).length;
    var numBytesFinal = Math.ceil(numBitsInit/7);
    var res = 0;
    var mask7bits = 127; // 7 bits '1' 

    for (var i = 0; i < numBytesFinal; i++) {
        res += (num & mask7bits) << (8 * i);
        num >>= 7;
        if (i > 0)
            res += Math.pow(2, (8 * i) + 7);
    }

    this.dataView.writeUnsigned(res, numBytesFinal*8);
    return numBytesFinal*8;
}

if (typeof exports !== 'undefined') {
    module.exports = GolombBitStream;  
}
