require('./log-simple.js');
require('./stream.js');
require('./box.js');
require('./box-parse.js');
require('./parsing/emsg.js');
require('./parsing/styp.js');
require('./parsing/ftyp.js');
require('./parsing/mdhd.js');
require('./parsing/mfhd.js');
require('./parsing/mvhd.js');
require('./parsing/sidx.js');
require('./parsing/ssix.js');
require('./parsing/tkhd.js');
require('./parsing/tfhd.js');
require('./parsing/tfdt.js');
require('./parsing/trun.js');
require('./isofile.js');
require('./box-print.js');
require('./mp4box.js');

var BoxParser = require("./box.js").BoxParser;
var ISOFile = require('./isofile.js').ISOFile;
var Log = require('./log-simple.js').Log;
var MP4BoxStream = require('./stream.js').MP4BoxStream;
var createFile = require('./mp4box.js').createFile;

if (typeof exports !== 'undefined') {
	exports.createFile = createFile;
	exports.BoxParser = BoxParser;
	exports.ISOFile = ISOFile;
	exports.Log = Log;
	exports.MP4BoxStream = MP4BoxStream;
}
