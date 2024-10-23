import { Box } from './box';
import { BoxParser } from './box-parser';
import { MP4BoxStream } from './stream';

/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
export class VTTin4Parser {
  parseSample(data: { buffer: ArrayBuffer }) {
    const cues: Box[] = [];
    const stream = new MP4BoxStream(data.buffer);

    while (!stream.isEos()) {
      const cue = BoxParser.parseOneBox(stream, false);
      if (cue.code === BoxParser.OK && cue.box?.type === 'vttc') {
        cues.push(cue.box);
      }
    }
    return cues;
  }

  getText(startTime: number, endTime: number, data: unknown) {
    function pad(n: string | number | any[], width: number, z?: string) {
      z = z || '0';
      n = n + '';
      return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
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
      string += cueIn4.payl.text;
    }
    return string;
  }
}

export class XMLSubtitlein4Parser {
  parseSample(sample: {
    data: { buffer: ArrayBuffer; length: number };
    subsamples: string | any[];
  }) {
    const res = {
      resources: [] as Array<Uint8Array>,
      documentString: '',
      document: undefined as undefined | Document,
    };
    const stream = new MP4BoxStream(sample.data.buffer);
    if (!sample.subsamples || sample.subsamples.length === 0) {
      res.documentString = stream.readString(sample.data.length);
    } else {
      res.documentString = stream.readString(sample.subsamples[0].size);
      if (sample.subsamples.length > 1) {
        for (let i = 1; i < sample.subsamples.length; i++) {
          res.resources[i] = stream.readUint8Array(sample.subsamples[i].size);
        }
      }
    }
    if (typeof DOMParser !== 'undefined') {
      res.document = new DOMParser().parseFromString(res.documentString, 'application/xml');
    }
    return res;
  }
}

export class Textin4Parser {
  parseSample(sample: { data: { buffer: ArrayBuffer; length: number } }) {
    var textString: string;
    var stream = new MP4BoxStream(sample.data.buffer);
    textString = stream.readString(sample.data.length);
    return textString;
  }

  parseConfig(data: { buffer: ArrayBuffer }) {
    var textString: string;
    var stream = new MP4BoxStream(data.buffer);
    stream.readUint32(); // version & flags
    textString = stream.readCString();
    return textString;
  }
}
