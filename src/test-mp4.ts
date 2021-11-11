/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
import type { NumberArray } from './types';

import { BoxParser } from './box';
import { MP4BoxStream } from './stream';

export class VTTin4Parser {
  parseSample(data: NumberArray) {
    var cues, cue;
    var stream = new MP4BoxStream(data.buffer);
    cues = [];
    while (!stream.isEos()) {
      cue = BoxParser.parseOnebox(stream, false);
      if (cue.code === BoxParser.OK && cue.box && cue.box.type === 'vttc') {
        cues.push(cue.box);
      }
    }
    return cues;
  }

  getText(startTime: number, endTime: number, data: NumberArray) {
    function pad(n: number, width: number, z?: string) {
      z = z || '0';
      let ns = n + '';
      return ns.length >= width ? n : new Array(width - ns.length + 1).join(z) + n;
    }
    function secToTimestamp(insec: number) {
      var h = Math.floor(insec / 3600);
      var m = Math.floor((insec - h * 3600) / 60);
      var s = Math.floor(insec - h * 3600 - m * 60);
      var ms = Math.floor((insec - h * 3600 - m * 60 - s) * 1000);
      return '' + pad(h, 2) + ':' + pad(m, 2) + ':' + pad(s, 2) + '.' + pad(ms, 3);
    }
    var cues = this.parseSample(data);
    var string = '';
    for (var i = 0; i < cues.length; i++) {
      var cueIn4 = cues[i];
      string += secToTimestamp(startTime) + ' --> ' + secToTimestamp(endTime) + '\r\n';
      string += cueIn4.payl?.text;
    }
    return string;
  }
}

export class XMLSubtitlein4Parser {
  parseSample = function (sample: any) {
    var res: any = {};
    var i;
    res.resources = [];
    var stream = new MP4BoxStream(sample.data.buffer);
    if (!sample.subsamples || sample.subsamples.length === 0) {
      res.documentString = stream.readString(sample.data.length);
    } else {
      res.documentString = stream.readString(sample.subsamples[0].size);
      if (sample.subsamples.length > 1) {
        for (i = 1; i < sample.subsamples.length; i++) {
          res.resources[i] = stream.readUint8Array(sample.subsamples[i].size);
        }
      }
    }
    if (typeof DOMParser !== 'undefined') {
      res.document = new DOMParser().parseFromString(res.documentString, 'application/xml');
    }
    return res;
  };
}

export class Textin4Parser {
  parseSample(sample: any) {
    var textString;
    var stream = new MP4BoxStream(sample.data.buffer);
    textString = stream.readString(sample.data.length);
    return textString;
  }

  parseConfig(data: NumberArray) {
    var textString;
    var stream = new MP4BoxStream(data.buffer);
    stream.readUint32(); // version & flags
    textString = stream.readCString();
    return textString;
  }
}
