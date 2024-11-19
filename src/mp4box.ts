/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */

import { ISOFile } from '#/isofile';
import { MultiBufferStream } from './buffer';

export const MP4Box = {
  createFile(keepMdatData = true, stream: MultiBufferStream) {
    /* Boolean indicating if bytes containing media data should be kept in memory */
    var file = new ISOFile(stream);
    file.discardMdatData = keepMdatData ? false : true;
    return file;
  },
};
