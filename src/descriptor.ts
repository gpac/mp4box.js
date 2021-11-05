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

interface DescriptorCtor {
  new (_tag?: number, _size?: number): Descriptor;
}

type DescriptorString = `${string}Descriptor`;

export class MPEG4DescriptorParser {
  descTagToName: DescriptorString[] = [];
  // classes: { [prop: DescriptorString]: DescriptorCtor } = {};
  classes: any = {};

  constructor() {
    this.descTagToName[ES_DescrTag] = 'ES_Descriptor';
    this.descTagToName[DecoderConfigDescrTag] = 'DecoderConfigDescriptor';
    this.descTagToName[DecSpecificInfoTag] = 'DecoderSpecificInfoDescriptor';
    this.descTagToName[SLConfigDescrTag] = 'SLConfigDescriptor';

    this.classes['Descriptor'] = Descriptor;
    this.classes['ES_Descriptor'] = ES_Descriptor;
    this.classes['DecoderConfigDescriptor'] = DecoderConfigDescriptor;
    this.classes['DecoderSpecificInfoDescriptor'] = DecoderSpecificInfo;
    this.classes['SLConfigDescriptor'] = SLConfigDescriptor;
  }
  getDescriptorName(tag: number) {
    return this.descTagToName[tag];
  }

  parseOneDescriptor(stream: DataStream) {
    let hdrSize = 0;
    let size = 0;
    let tag: number;
    let byteRead: number;
    let desc: Descriptor;
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
        (this.descTagToName[tag] || 'Descriptor ' + tag) +
        ', size ' +
        size +
        ' at position ' +
        stream.getPosition() +
        'hdrSize' +
        hdrSize
    );
    if (this.descTagToName[tag]) {
      const Ctor = this.classes[this.descTagToName[tag]] as DescriptorCtor;
      desc = new Ctor(size);
    } else {
      desc = new Descriptor(size);
    }
    desc.parse(stream);
    return desc;
  }
}

export class Descriptor extends MPEG4DescriptorParser {
  tag: number;
  size: number;
  oti?: number;
  data?: number[];
  descs: Descriptor[] = [];
  constructor(_tag?: number, _size?: number) {
    super();
    this.tag = _tag ? _tag : 0;
    this.size = _size ? _size : 0;
  }
  parse(stream: DataStream) {
    this.data = Array.from(stream.readUint8Array(this.size));
  }
  findDescriptor(tag: number) {
    for (var i = 0; i < this.descs.length; i++) {
      if (this.descs[i].tag == tag) {
        return this.descs[i];
      }
    }
    return null;
  }
  parseRemainingDescriptors(stream: DataStream) {
    var start = stream.position;
    while (stream.position < start + this.size) {
      var desc = this.parseOneDescriptor(stream);
      this.descs.push(desc);
    }
  }
}

export class ES_Descriptor extends Descriptor {
  ES_ID?: number;
  flags?: number;
  dependsOn_ES_ID?: number;
  OCR_ES_ID?: number;
  URL?: string;

  constructor(size?: number) {
    super(0x03, size);
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
      var l = stream.readUint8();
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
  getOTI() {
    var dcd = this.findDescriptor(DecoderConfigDescrTag);
    if (dcd) {
      return dcd.oti;
    } else {
      return 0;
    }
  }
  getAudioConfig() {
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

export class DecoderConfigDescriptor extends Descriptor {
  streamType?: number;
  bufferSize?: number;
  maxBitrate?: number;
  avgBitrate?: number;
  constructor(size?: number) {
    super(DecoderConfigDescrTag, size);
  }
  parse(stream: DataStream) {
    this.oti = stream.readUint8();
    this.streamType = stream.readUint8();
    this.bufferSize = stream.readUint24();
    this.maxBitrate = stream.readUint32();
    this.avgBitrate = stream.readUint32();
    this.size -= 13;
    this.parseRemainingDescriptors(stream);
  }
}

export class DecoderSpecificInfo extends Descriptor {
  constructor(size?: number) {
    super(DecSpecificInfoTag, size);
  }
}

export class SLConfigDescriptor extends Descriptor {
  constructor(size?: number) {
    super(SLConfigDescrTag, size);
  }
}
