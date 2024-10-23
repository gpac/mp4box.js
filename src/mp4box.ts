/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */

import { MultiBufferStream } from './buffer';
import { ISOFile } from './isofile';

export const MP4Box = {
  createFile(_keepMdatData: boolean | undefined, _stream: MultiBufferStream) {
    /* Boolean indicating if bytes containing media data should be kept in memory */
    var keepMdatData = _keepMdatData !== undefined ? _keepMdatData : true;
    var file = new ISOFile(_stream);
    file.discardMdatData = keepMdatData ? false : true;
    return file;
  },
};
