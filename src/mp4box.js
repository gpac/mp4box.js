/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var MP4Box = {};

MP4Box.createFile = function (_keepMdatData, _stream) {
	/* Boolean indicating if bytes containing media data should be kept in memory */
	var keepMdatData = (_keepMdatData !== undefined ? _keepMdatData : true);
	var file = new ISOFile(_stream);
	file.discardMdatData = (keepMdatData ? false : true);
	return file;
}

if (typeof exports !== 'undefined') {
	exports.createFile = MP4Box.createFile;
}
