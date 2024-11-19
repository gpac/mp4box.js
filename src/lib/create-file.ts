/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */

import { MultiBufferStream } from '#/buffer';
import { ISOFile } from '#/isofile';

export function createFile(keepMdatData = true, stream: MultiBufferStream) {
  /* Boolean indicating if bytes containing media data should be kept in memory */
  var file = new ISOFile(stream);
  file.discardMdatData = keepMdatData ? false : true;
  return file;
}
