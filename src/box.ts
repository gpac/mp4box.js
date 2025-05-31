/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */

import { MultiBufferStream } from '#/buffer';
import { MAX_SIZE } from '#/constants';
import { DataStream, Endianness } from '#/DataStream';
import { Log } from '#/log';
import { MP4BoxStream } from '#/stream';
import type { BoxFourCC, Extends, Output, Reference } from '@types';

export class Box {
  static registryId = Symbol.for('BoxIdentifier');

  boxes?: Array<Box>;
  data: Array<number> | Uint8Array;
  has_unparsed_data?: boolean;
  hdr_size?: number;
  language: number;
  languageString?: string;
  sizePosition?: number;
  start?: number;
  track_ids?: Uint32Array;
  box_name?: string;
  uuid?: string;

  // Handle box designation (4CC)
  // Instance-defined type (used for dynamic box types)
  private _type?: string;
  static fourcc?: string;

  get type(): string | undefined {
    return (this.constructor as typeof Box).fourcc ?? this._type;
  }
  set type(value: string) {
    this._type = value;
  }

  constructor(public size = 0) {}

  addBox<T extends Extends<this, Box>>(box: T): T {
    if (!this.boxes) {
      this.boxes = [];
    }
    this.boxes.push(box);
    if (this[box.type + 's']) {
      this[box.type + 's'].push(box);
    } else {
      this[box.type] = box;
    }
    return box;
  }

  set<TProp extends keyof this>(prop: TProp, value: this[TProp]) {
    this[prop] = value;
    return this;
  }

  addEntry(value: Box, _prop?: string) {
    const prop = _prop || 'entries';
    if (!this[prop]) {
      this[prop] = [];
    }
    this[prop].push(value);
    return this;
  }

  /** @bundle box-write.js */
  writeHeader(stream: DataStream, msg?: string) {
    this.size += 8;
    if (this.size > MAX_SIZE) {
      this.size += 8;
    }
    if (this.type === 'uuid') {
      this.size += 16;
    }
    Log.debug(
      'BoxWriter',
      'Writing box ' +
        this.type +
        ' of size: ' +
        this.size +
        ' at position ' +
        stream.getPosition() +
        (msg || ''),
    );
    if (this.size > MAX_SIZE) {
      stream.writeUint32(1);
    } else {
      this.sizePosition = stream.getPosition();
      stream.writeUint32(this.size);
    }
    stream.writeString(this.type, null, 4);
    if (this.type === 'uuid') {
      // @ts-expect-error FIXME: find out actual type of uuid
      stream.writeUint8Array(this.uuid);
    }
    if (this.size > MAX_SIZE) {
      stream.writeUint64(this.size);
    }
  }

  /** @bundle box-write.js */
  write(stream: DataStream) {
    if (this.type === 'mdat') {
      /* TODO: fix this */
      if (this.data) {
        this.size = this.data.length;
        this.writeHeader(stream);
        stream.writeUint8Array(this.data);
      }
    } else {
      this.size = this.data ? this.data.length : 0;
      this.writeHeader(stream);
      if (this.data) {
        stream.writeUint8Array(this.data);
      }
    }
  }

  /** @bundle box-print.js */
  printHeader(output: Output) {
    this.size += 8;
    if (this.size > MAX_SIZE) {
      this.size += 8;
    }
    if (this.type === 'uuid') {
      this.size += 16;
    }
    output.log(output.indent + 'size:' + this.size);
    output.log(output.indent + 'type:' + this.type);
  }

  /** @bundle box-print.js */
  print(output: Output) {
    this.printHeader(output);
  }

  /** @bundle box-parse.js */
  parse(stream: MultiBufferStream) {
    if (this.type !== 'mdat') {
      this.data = stream.readUint8Array(this.size - this.hdr_size);
    } else {
      if (this.size === 0) {
        stream.seek(stream.getEndPosition());
      } else {
        stream.seek(this.start + this.size);
      }
    }
  }

  /** @bundle box-parse.js */
  parseDataAndRewind(stream: MultiBufferStream | MP4BoxStream) {
    this.data = stream.readUint8Array(this.size - this.hdr_size);
    // rewinding
    stream.position -= this.size - this.hdr_size;
  }

  /** @bundle box-parse.js */
  parseLanguage(stream: MultiBufferStream) {
    this.language = stream.readUint16();
    const chars = [];
    chars[0] = (this.language >> 10) & 0x1f;
    chars[1] = (this.language >> 5) & 0x1f;
    chars[2] = this.language & 0x1f;
    this.languageString = String.fromCharCode(chars[0] + 0x60, chars[1] + 0x60, chars[2] + 0x60);
  }

  /** @bundle isofile-advanced-creation.js */
  computeSize(stream_?: MultiBufferStream) {
    const stream = stream_ || new MultiBufferStream();
    stream.endianness = Endianness.BIG_ENDIAN;
    this.write(stream);
  }
}

export class FullBox extends Box {
  flags = 0;
  version = 0;

  /** @bundle box-write.js */
  writeHeader(stream: MultiBufferStream) {
    this.size += 4;
    super.writeHeader(stream, ' v=' + this.version + ' f=' + this.flags);
    stream.writeUint8(this.version);
    stream.writeUint24(this.flags);
  }

  /** @bundle box-print.js */
  printHeader(output: Output) {
    this.size += 4;
    super.printHeader(output);
    output.log(output.indent + 'version:' + this.version);
    output.log(output.indent + 'flags:' + this.flags);
  }

  /** @bundle box-parse.js */
  parseDataAndRewind(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.data = stream.readUint8Array(this.size - this.hdr_size);
    // restore the header size as if the full header had not been parsed
    this.hdr_size -= 4;
    // rewinding
    stream.position -= this.size - this.hdr_size;
  }

  /** @bundle box-parse.js */
  parseFullHeader(stream: MultiBufferStream) {
    this.version = stream.readUint8();
    this.flags = stream.readUint24();
    this.hdr_size += 4;
  }

  /** @bundle box-parse.js */
  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.data = stream.readUint8Array(this.size - this.hdr_size);
  }
}

export class SampleGroupEntry {
  static registryId = Symbol.for('SampleGroupEntryIdentifier');

  data: ArrayLike<number>;
  description_length: number;

  constructor(public grouping_type: string) {}

  /** @bundle writing/samplegroups/samplegroup.js */
  write(stream: MultiBufferStream) {
    stream.writeUint8Array(this.data);
  }

  /** @bundle parsing/samplegroups/samplegroup.js */
  parse(stream: MultiBufferStream) {
    Log.warn('BoxParser', 'Unknown Sample Group type: ' + this.grouping_type);
    this.data = stream.readUint8Array(this.description_length);
  }
}

export class TrackGroupTypeBox extends FullBox {
  track_group_id: number;

  /** @bundle parsing/TrackGroup.js */
  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.track_group_id = stream.readUint32();
  }
}

/** @bundle parsing/singleitemtypereference.js */
export class SingleItemTypeReferenceBox extends Box {
  from_item_ID: number;
  references: Array<Reference>;

  constructor(
    fourcc: string,
    size: number,
    public box_name: string,
    public hdr_size: number,
    public start: number,
  ) {
    super(size);
    this.type = fourcc as BoxFourCC;
  }
  parse(stream: MultiBufferStream): void {
    this.from_item_ID = stream.readUint16();
    const count = stream.readUint16();
    this.references = [];
    for (let i = 0; i < count; i++) {
      this.references[i] = {
        to_item_ID: stream.readUint16(),
      };
    }
  }
}

/** @bundle parsing/singleitemtypereferencelarge.js */
export class SingleItemTypeReferenceBoxLarge extends Box {
  from_item_ID: number;
  references: Array<Reference>;

  constructor(
    fourcc: string,
    size: number,
    public box_name: string,
    public hdr_size: number,
    public start: number,
  ) {
    super(size);
    this.type = fourcc as BoxFourCC;
  }
  parse(stream: MultiBufferStream): void {
    this.from_item_ID = stream.readUint32();
    const count = stream.readUint16();
    this.references = [];
    for (let i = 0; i < count; i++) {
      this.references[i] = {
        to_item_ID: stream.readUint32(),
      };
    }
  }
}

/** @bundle parsing/TrakReference.js */
export class TrackReferenceTypeBox extends Box {
  constructor(
    fourcc: string,
    size: number,
    public hdr_size: number,
    public start: number,
  ) {
    super(size);
    this.type = fourcc as BoxFourCC;
  }

  parse(stream: DataStream) {
    this.track_ids = stream.readUint32Array((this.size - this.hdr_size) / 4);
  }

  /** @bundle box-write.js */
  write(stream: DataStream) {
    this.size = this.track_ids.length * 4;
    this.writeHeader(stream);
    stream.writeUint32Array(this.track_ids);
  }
}
