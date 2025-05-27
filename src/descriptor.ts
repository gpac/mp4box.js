/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */

import { MultiBufferStream } from '#/buffer';
import { DataStream } from '#/DataStream';
import { Log } from '#/log';

const ES_DescrTag = 0x03;
const DecoderConfigDescrTag = 0x04;
const DecSpecificInfoTag = 0x05;
const SLConfigDescrTag = 0x06;

export class Descriptor {
  descs = [];
  data: Uint8Array;

  constructor(
    public tag: number,
    public size: number,
  ) {}

  parse(stream: DataStream) {
    this.data = stream.readUint8Array(this.size);
  }

  findDescriptor(tag: number) {
    for (let i = 0; i < this.descs.length; i++) {
      if (this.descs[i].tag === tag) {
        return this.descs[i];
      }
    }
    return null;
  }

  parseOneDescriptor(stream: DataStream): DescriptorKinds {
    let size = 0;
    const tag = stream.readUint8();
    let byteRead = stream.readUint8();
    while (byteRead & 0x80) {
      size = (size << 7) + (byteRead & 0x7f);
      byteRead = stream.readUint8();
    }
    size = (size << 7) + (byteRead & 0x7f);
    Log.debug(
      'Descriptor',
      'Found ' +
        (descTagToName[tag] || 'Descriptor ' + tag) +
        ', size ' +
        size +
        ' at position ' +
        stream.getPosition(),
    );
    const desc = descTagToName[tag]
      ? new DESCRIPTOR_CLASSES[descTagToName[tag]](size)
      : // @ts-expect-error FIXME: Descriptor expects a tag as first parameter
        new Descriptor(size);

    desc.parse(stream);
    return desc;
  }

  parseRemainingDescriptors(stream: DataStream) {
    const start = stream.position;
    while (stream.position < start + this.size) {
      console.log('this.parseOneDescriptor', this, this.parseOneDescriptor);
      const desc = this.parseOneDescriptor?.(stream);
      this.descs.push(desc);
    }
  }
}

export class ES_Descriptor extends Descriptor {
  dependsOn_ES_ID: number;
  ES_ID: number;
  flags: number;
  OCR_ES_ID: number;
  URL: string;

  constructor(size?: number) {
    super(ES_DescrTag, size);
  }

  parse(stream: MultiBufferStream) {
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

  getOTI() {
    const dcd = this.findDescriptor(DecoderConfigDescrTag);
    if (dcd) {
      return dcd.oti;
    } else {
      return 0;
    }
  }

  getAudioConfig() {
    const dcd = this.findDescriptor(DecoderConfigDescrTag);
    if (!dcd) return null;
    const dsi = dcd.findDescriptor(DecSpecificInfoTag);
    if (dsi && dsi.data) {
      let audioObjectType = (dsi.data[0] & 0xf8) >> 3;
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
  avgBitrate: number;
  bufferSize: number;
  maxBitrate: number;
  oti: number;
  streamType: number;
  upStream: boolean;

  constructor(size: number) {
    super(DecoderConfigDescrTag, size);
  }
  parse(stream: MultiBufferStream) {
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
  constructor(size: number) {
    super(DecSpecificInfoTag, size);
  }
}

class SLConfigDescriptor extends Descriptor {
  constructor(size: number) {
    super(SLConfigDescrTag, size);
  }
}

const DESCRIPTOR_CLASSES = {
  Descriptor,
  ES_Descriptor,
  DecoderConfigDescriptor,
  DecoderSpecificInfo,
  SLConfigDescriptor,
};
type DescriptorKinds =
  | Descriptor
  | ES_Descriptor
  | DecoderConfigDescriptor
  | DecoderSpecificInfo
  | SLConfigDescriptor;

const descTagToName = {
  [ES_DescrTag]: 'ES_Descriptor',
  [DecoderConfigDescrTag]: 'DecoderConfigDescriptor',
  [DecSpecificInfoTag]: 'DecoderSpecificInfo',
  [SLConfigDescrTag]: 'SLConfigDescriptor',
};

export class MPEG4DescriptorParser {
  getDescriptorName(tag: number) {
    return descTagToName[tag];
  }

  parseOneDescriptor = Descriptor.prototype.parseOneDescriptor;
}
