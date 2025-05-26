/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */

import { MultiBufferStream } from '#/buffer';
import { ERR_NOT_ENOUGH_DATA, MAX_SIZE, OK } from '#/constants';
import type { DataStream } from '#/DataStream';
import { Log } from '#/log';
import { BoxRegistry } from '#/registry';
import type { MP4BoxStream } from '#/stream';
import type { BoxKind, Extends, Output, Reference } from '@types';

export class Box {
  boxes?: Box[];
  data: number[] | Uint8Array;
  has_unparsed_data?: boolean;
  hdr_size?: number;
  language: number;
  languageString?: string;
  sizePosition?: number;
  start?: number;
  track_ids?: Uint32Array;
  type?: string;
  box_name?: string;
  uuid?: string;

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
    stream.endianness = MultiBufferStream.BIG_ENDIAN;
    this.write(stream);
  }
}

export class FullBox extends Box {
  flags = 0;
  version = 0;

  /** @bundle box-write.js */
  writeHeader(stream: MultiBufferStream) {
    this.size += 4;
    // TODO: writeHeader is not a static method so not sure what to do here
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

export class ContainerBox extends Box {
  subBoxNames?: readonly string[];

  /** @bundle box-write.js */
  write(stream: MultiBufferStream) {
    this.size = 0;
    this.writeHeader(stream);
    for (let i = 0; i < this.boxes.length; i++) {
      if (this.boxes[i]) {
        this.boxes[i].write(stream);
        this.size += this.boxes[i].size;
      }
    }
    /* adjusting the size, now that all sub-boxes are known */
    Log.debug('BoxWriter', 'Adjusting box ' + this.type + ' with new size ' + this.size);
    stream.adjustUint32(this.sizePosition, this.size);
  }

  /** @bundle box-print.js */
  print(output: Output) {
    this.printHeader(output);
    for (let i = 0; i < this.boxes.length; i++) {
      if (this.boxes[i]) {
        const prev_indent = output.indent;
        output.indent += ' ';
        this.boxes[i].print(output);
        output.indent = prev_indent;
      }
    }
  }

  /** @bundle box-parse.js */
  parse(stream: MultiBufferStream) {
    let ret: ReturnType<typeof parseOneBox>;
    while (stream.getPosition() < this.start + this.size) {
      ret = parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
      if (ret.code === OK) {
        const box = ret.box as BoxKind;
        if (!this.boxes) {
          this.boxes = [];
        }
        /* store the box in the 'boxes' array to preserve box order (for offset) but also store box in a property for more direct access */
        this.boxes.push(box);
        if (this.subBoxNames && this.subBoxNames.indexOf(box.type) !== -1) {
          this[this.subBoxNames[this.subBoxNames.indexOf(box.type)] + 's'].push(box);
        } else {
          const box_type = box.type !== 'uuid' ? box.type : box.uuid;
          if (this[box_type]) {
            Log.warn(
              'ContainerBox',
              'Box of type ' + box_type + ' already stored in field of this type',
            );
          } else {
            this[box_type] = box;
          }
        }
      } else {
        return;
      }
    }
  }
}

export class SampleGroupEntry {
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

  constructor(
    public type: string,
    size: number,
  ) {
    super(size);
  }

  /** @bundle parsing/TrackGroup.js */
  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.track_group_id = stream.readUint32();
  }
}

/** @bundle parsing/singleitemtypereference.js */
export class SingleItemTypeReferenceBox extends Box {
  from_item_ID: number;
  references: Reference[];

  constructor(
    public type: string,
    size: number,
    public box_name: string,
    public hdr_size: number,
    public start: number,
  ) {
    super(size);
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
  references: Reference[];

  constructor(
    public type: string,
    size: number,
    public box_name: string,
    public hdr_size: number,
    public start: number,
  ) {
    super(size);
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
    public type: string,
    size: number,
    public hdr_size: number,
    public start: number,
  ) {
    super(size);
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

/**********************************************************************************/
/*                                                                                */
/*                                  Parse Utils                                   */
/*                                                                                */
/**********************************************************************************/

export function parseUUID(stream: MultiBufferStream | MP4BoxStream) {
  return parseHex16(stream);
}

export function parseHex16(stream: MultiBufferStream | MP4BoxStream) {
  let hex16 = '';
  for (let i = 0; i < 16; i++) {
    const hex = stream.readUint8().toString(16);
    hex16 += hex.length === 1 ? '0' + hex : hex;
  }
  return hex16;
}

export function parseOneBox(
  stream: MultiBufferStream | MP4BoxStream,
  headerOnly: boolean,
  parentSize?: number,
) {
  let box: Box;
  const start = stream.getPosition();
  let hdr_size = 0;
  let uuid: string;
  if (stream.getEndPosition() - start < 8) {
    Log.debug('BoxParser', 'Not enough data in stream to parse the type and size of the box');
    return { code: ERR_NOT_ENOUGH_DATA };
  }
  if (parentSize && parentSize < 8) {
    Log.debug('BoxParser', 'Not enough bytes left in the parent box to parse a new box');
    return { code: ERR_NOT_ENOUGH_DATA };
  }
  let size = stream.readUint32();
  const type = stream.readString(4);
  let box_type = type;
  Log.debug(
    'BoxParser',
    "Found box of type '" + type + "' and size " + size + ' at position ' + start,
  );
  hdr_size = 8;
  if (type === 'uuid') {
    if (stream.getEndPosition() - stream.getPosition() < 16 || parentSize - hdr_size < 16) {
      stream.seek(start);
      Log.debug('BoxParser', 'Not enough bytes left in the parent box to parse a UUID box');
      return { code: ERR_NOT_ENOUGH_DATA };
    }
    uuid = parseUUID(stream);
    hdr_size += 16;
    box_type = uuid;
  }
  if (size === 1) {
    if (
      stream.getEndPosition() - stream.getPosition() < 8 ||
      (parentSize && parentSize - hdr_size < 8)
    ) {
      stream.seek(start);
      Log.warn(
        'BoxParser',
        'Not enough data in stream to parse the extended size of the "' + type + '" box',
      );
      return { code: ERR_NOT_ENOUGH_DATA };
    }
    size = stream.readUint64();
    hdr_size += 8;
  } else if (size === 0) {
    /* box extends till the end of file or invalid file */
    if (parentSize) {
      size = parentSize;
    } else {
      /* box extends till the end of file */
      if (type !== 'mdat') {
        Log.error('BoxParser', "Unlimited box size not supported for type: '" + type + "'");
        box = new Box(size);
        box.type = type;
        return { code: OK, box, size: box.size };
      }
    }
  }
  if (size !== 0 && size < hdr_size) {
    Log.error(
      'BoxParser',
      'Box of type ' + type + ' has an invalid size ' + size + ' (too small to be a box)',
    );
    return {
      code: ERR_NOT_ENOUGH_DATA,
      type: type,
      size: size,
      hdr_size: hdr_size,
      start: start,
    };
  }
  if (size !== 0 && parentSize && size > parentSize) {
    Log.error(
      'BoxParser',
      "Box of type '" +
        type +
        "' has a size " +
        size +
        ' greater than its container size ' +
        parentSize,
    );
    return {
      code: ERR_NOT_ENOUGH_DATA,
      type: type,
      size: size,
      hdr_size: hdr_size,
      start: start,
    };
  }
  if (size !== 0 && start + size > stream.getEndPosition()) {
    stream.seek(start);
    Log.info('BoxParser', "Not enough data in stream to parse the entire '" + type + "' box");
    return {
      code: ERR_NOT_ENOUGH_DATA,
      type: type,
      size: size,
      hdr_size: hdr_size,
      start: start,
    };
  }
  if (headerOnly) {
    return { code: OK, type: type, size: size, hdr_size: hdr_size, start: start };
  } else {
    if (BoxRegistry[type + 'Box']) {
      box = new BoxRegistry[type + 'Box'](size);
    } else {
      if (type !== 'uuid') {
        Log.warn('BoxParser', "Unknown box type: '" + type + "'");
        box = new Box(size);
        box.type = type;
        box.has_unparsed_data = true;
      } else {
        if (uuid in BoxRegistry) {
          box = new BoxRegistry[uuid](size);
        } else {
          Log.warn('BoxParser', "Unknown uuid type: '" + uuid + "'");
          box = new Box(size);
          box.type = type;
          box.uuid = uuid;
          box.has_unparsed_data = true;
        }
      }
    }
  }
  box.hdr_size = hdr_size;
  /* recording the position of the box in the input stream */
  box.start = start;
  if (box.write === Box.prototype.write && box.type !== 'mdat') {
    Log.info(
      'BoxParser',
      "'" +
        box_type +
        "' box writing not yet implemented, keeping unparsed data in memory for later write",
    );
    box.parseDataAndRewind(stream);
  }
  // @ts-expect-error FIXME: figure out stream-types
  box.parse(stream);
  const diff = stream.getPosition() - (box.start + box.size);
  if (diff < 0) {
    Log.warn(
      'BoxParser',
      "Parsing of box '" +
        box_type +
        "' did not read the entire indicated box data size (missing " +
        -diff +
        ' bytes), seeking forward',
    );
    stream.seek(box.start + box.size);
  } else if (diff > 0) {
    Log.error(
      'BoxParser',
      "Parsing of box '" +
        box_type +
        "' read " +
        diff +
        ' more bytes than the indicated box data size, seeking backwards',
    );
    if (box.size !== 0) {
      stream.seek(box.start + box.size);
    }
  }
  return { code: OK, box, size: box.size };
}
