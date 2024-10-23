/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */

import { DataStream } from './DataStream';
import { Log } from './log';

const ES_DescrTag = 0x03;
const DecoderConfigDescrTag = 0x04;
const DecSpecificInfoTag = 0x05;
const SLConfigDescrTag = 0x06;

export class Descriptor {
  descs = [];
  data: unknown;
  constructor(public tag: unknown, public size: number) {}

  parse(stream: { readUint8Array: (arg0: unknown) => any }) {
    this.data = stream.readUint8Array(this.size);
  }

  findDescriptor(tag: number) {
    for (var i = 0; i < this.descs.length; i++) {
      if (this.descs[i].tag == tag) {
        return this.descs[i];
      }
    }
    return null;
  }

  parseRemainingDescriptors(stream: { position: number }) {
    var start = stream.position;
    while (stream.position < start + this.size) {
      var desc = that.parseOneDescriptor(stream);
      this.descs.push(desc);
    }
  }
}

class ES_Descriptor extends Descriptor {
  ES_ID: number;
  flags: number;
  dependsOn_ES_ID: number;
  URL: unknown;
  OCR_ES_ID: number;

  constructor(size?: number) {
    super(ES_DescrTag, size);
  }

  parse(stream: DataStream) {
    this.ES_ID = stream.readUint16();
    this.flags = stream.readUint8();
    this.size -= 3;
    if (this.flags & 0x80) {
      this.dependsOn_ES_ID = stream.readUint16();
      this.size -= 2;
    } else {
      this.dependsOn_ES_ID = 0;
    }
    if (this.flags & 0x40) {
      const l = stream.readUint8();
      this.URL = stream.readString(l);
      this.size -= l + 1;
    } else {
      this.URL = '';
    }
    if (this.flags & 0x20) {
      this.OCR_ES_ID = stream.readUint16();
      this.size -= 2;
    } else {
      this.OCR_ES_ID = 0;
    }
    this.parseRemainingDescriptors(stream);
  }

  getOTI(stream: unknown) {
    var dcd = this.findDescriptor(DecoderConfigDescrTag);
    if (dcd) {
      return dcd.oti;
    } else {
      return 0;
    }
  }

  getAudioConfig(stream: unknown) {
    var dcd = this.findDescriptor(DecoderConfigDescrTag);
    if (!dcd) return null;
    var dsi = dcd.findDescriptor(DecSpecificInfoTag);
    if (dsi && dsi.data) {
      var audioObjectType = (dsi.data[0] & 0xf8) >> 3;
      if (audioObjectType === 31 && dsi.data.length >= 2) {
        audioObjectType = 32 + ((dsi.data[0] & 0x7) << 3) + ((dsi.data[1] & 0xe0) >> 5);
      }
      return audioObjectType;
    } else {
      return null;
    }
  }
}

class DecoderConfigDescriptor extends Descriptor {
  oti: number;
  streamType: number;
  upStream: boolean;
  bufferSize: number;
  maxBitrate: number;
  avgBitrate: number;
  constructor(size: unknown) {
    super(DecoderConfigDescrTag, size);
  }
  parse(stream: DataStream) {
    this.oti = stream.readUint8();
    this.streamType = stream.readUint8();
    this.upStream = ((this.streamType >> 1) & 1) !== 0;
    this.streamType = this.streamType >>> 2;
    this.bufferSize = stream.readUint24();
    this.maxBitrate = stream.readUint32();
    this.avgBitrate = stream.readUint32();
    this.size -= 13;
    this.parseRemainingDescriptors(stream);
  }
}

class DecoderSpecificInfo extends Descriptor {
  constructor(size: unknown) {
    super(DecSpecificInfoTag, size);
  }
}

class SLConfigDescriptor extends Descriptor {
  constructor(size: unknown) {
    super(SLConfigDescrTag, size);
  }
}

const classes = {
  Descriptor,
  ES_Descriptor,
  DecoderConfigDescriptor,
  DecoderSpecificInfo,
  SLConfigDescriptor,
};

const descTagToName = {
  [ES_DescrTag]: 'ES_Descriptor',
  [DecoderConfigDescrTag]: 'DecoderConfigDescriptor',
  [DecSpecificInfoTag]: 'DecoderSpecificInfo',
  [SLConfigDescrTag]: 'SLConfigDescriptor',
};

export class MPEG4DescriptorParser {
  constructor() {}

  getDescriptorName(tag: number) {
    return descTagToName[tag];
  }

  parseOneDescriptor(stream: DataStream) {
    var hdrSize = 0;
    var size = 0;
    var tag: number;
    var desc: Descriptor;
    var byteRead: number;
    tag = stream.readUint8();
    hdrSize++;
    byteRead = stream.readUint8();
    hdrSize++;
    while (byteRead & 0x80) {
      size = (byteRead & 0x7f) << 7;
      byteRead = stream.readUint8();
      hdrSize++;
    }
    size += byteRead & 0x7f;
    Log.debug(
      'MPEG4DescriptorParser',
      'Found ' +
        (descTagToName[tag] || 'Descriptor ' + tag) +
        ', size ' +
        size +
        ' at position ' +
        stream.getPosition(),
    );
    if (descTagToName[tag]) {
      desc = new classes[descTagToName[tag]](size);
    } else {
      desc = new classes.Descriptor(size);
    }
    desc.parse(stream);
    return desc;
  }
}
