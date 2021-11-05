import type { PrintOutput, Sample } from './types';

import { MultiBufferStream, BoxStream, DataStream } from './buffer';
import { Log } from './log';

import box_diff from './box-diff';
import box_parse from './box-parse';
import box_print from './box-print';
import box_write from './box-write';

import parsing from './parsing';
import writing from './writing';
import box_codec from './box-codecs';
import box_unpack from './box-unpack';

// Boxes to be created with default parsing
const BASIC_BOXES = ['mdat', 'idat', 'free', 'skip', 'meco', 'strk'];
const FULL_BOXES = ['hmhd', 'nmhd', 'iods', 'xml ', 'bxml', 'ipro', 'mere'];
const CONTAINER_BOXES = [
  ['moov', ['trak', 'pssh']],
  ['trak'],
  ['edts'],
  ['mdia'],
  ['minf'],
  ['dinf'],
  ['stbl', ['sgpd', 'sbgp']],
  ['mvex', ['trex']],
  ['moof', ['traf']],
  ['traf', ['trun', 'sgpd', 'sbgp']],
  ['vttc'],
  ['tref'],
  ['iref'],
  ['mfra', ['tfra']],
  ['meco'],
  ['hnti'],
  ['hinf'],
  ['strk'],
  ['strd'],
  ['sinf'],
  ['rinf'],
  ['schi'],
  ['trgr'],
  ['udta', ['kind']],
  ['iprp', ['ipma']],
  ['ipco'],
];

interface BoxCtor {
  new (type?: string, size?: number, uuid?: string): Box;
}
interface SampleEntryCotr {
  new (type?: string, size?: number, hdr_size?: number, start?: number): SampleEntry;
}
type ParseMethod = (stream: BoxStream) => void;

export class _BoxParser {
  ERR_INVALID_DATA = -1;
  ERR_NOT_ENOUGH_DATA = 0;
  OK = 1;

  BASIC_BOXES = BASIC_BOXES;
  FULL_BOXES = FULL_BOXES;
  CONTAINER_BOXES = CONTAINER_BOXES;

  // Boxes effectively created
  boxCodes: string[] = [];
  fullBoxCodes: string[] = [];
  containerBoxCodes: string[] = [];
  sampleEntryCodes: { [p: string]: string[] } = {};
  sampleGroupEntryCodes = [];
  trackGroupTypes: string[] = [];
  UUIDBoxes: any = {};
  UUIDs: string[] = [];

  subBoxNames?: string[];

  [prop: `${string}Box`]: BoxCtor;
  [prop: `${string}SampleEntry`]: SampleEntryCotr;
  [prop: `${string}SampleGroupEntry`]: BoxCtor;
  constructor() {
    this.Box = Box;
    this.FullBox = FullBox;
    this.SampleEntry = SampleEntry;
    this.ContainerBox = ContainerBox;
    this.TrackGroupTypeBox = FullBox;

    /* creating constructors for simple boxes */
    this.BASIC_BOXES.forEach((type) => {
      this.createBoxCtor(type);
    });
    this.FULL_BOXES.forEach((type) => {
      this.createFullBoxCtor(type);
    });
    this.CONTAINER_BOXES.forEach((types) => {
      this.createContainerBoxCtor(types[0] as string, null, types[1] as string[]);
    });
  }

  createBoxCtor(type: string, parseMethod?: ParseMethod) {
    this.boxCodes.push(type);
    const prop = (type + 'Box') as keyof _BoxParser;
    this[prop] = function (this: Box, size: number) {
      this.size = size;
    };
    this[prop].prototype = new Box(type);
    if (parseMethod) this[prop].prototype.parse = parseMethod;
  }

  createFullBoxCtor(type: string, parseMethod?: ParseMethod) {
    //BoxParser.fullBoxCodes.push(type);
    const prop = (type + 'Box') as keyof _BoxParser;
    this[prop] = function (this: FullBox, size: number) {
      this.size = size;
    };
    this[prop].prototype = new FullBox(type);
    this[prop].prototype.parse = function (stream: BoxStream) {
      this.parseFullHeader(stream);
      if (parseMethod) {
        parseMethod.call(this, stream);
      }
    };
  }

  static addSubBoxArrays(this: Box, subBoxNames?: string[]) {
    if (!subBoxNames) return;
    this.subBoxNames = subBoxNames;
    const nbSubBoxes = subBoxNames.length;
    for (let k = 0; k < nbSubBoxes; k++) {
      this[(subBoxNames[k] + 's') as keyof _BoxParser] = [];
    }
  }

  createContainerBoxCtor(type: string, parseMethod: ParseMethod | null, subBoxNames?: string[]) {
    //BoxParser.containerBoxCodes.push(type);
    const prop = (type + 'Box') as keyof _BoxParser;
    this[prop] = function (this: ContainerBox, size: number) {
      _BoxParser.addSubBoxArrays.call(this, subBoxNames);
      this.size = size;
      this.boxes = [];
    };
    this[prop].prototype = new ContainerBox(type);
    if (parseMethod) this[prop].prototype.parse = parseMethod;
  }

  createMediaSampleEntryCtor(mediaType: string, parseMethod?: ParseMethod, subBoxNames?: string[]) {
    this.sampleEntryCodes[mediaType] = [];
    const prop = (mediaType + 'SampleEntry') as keyof _BoxParser;
    this[prop] = function (this: SampleEntry, type: string, size: number) {
      _BoxParser.addSubBoxArrays.call(this, subBoxNames);
      this.type = type;
      this.size = size;
    };
    this[prop].prototype = new SampleEntry();
    if (parseMethod) this[prop].prototype.parse = parseMethod;
  }

  createSampleEntryCtor(
    mediaType: string,
    type: string,
    parseMethod?: ParseMethod,
    subBoxNames?: string[]
  ) {
    this.sampleEntryCodes[mediaType].push(type);
    const prop = (type + 'SampleEntry') as keyof _BoxParser;
    const mediaProp = (mediaType + 'SampleEntry') as keyof _BoxParser;
    this[prop] = function (this: SampleEntry, size: number) {
      this.size = size;
      this.boxes = [];
      _BoxParser.addSubBoxArrays.call(this, subBoxNames);
    };
    this[prop].prototype = new this[mediaProp](type);
    if (parseMethod) this[prop].prototype.parse = parseMethod;
  }

  createEncryptedSampleEntryCtor(mediaType: string, type: string, parseMethod?: ParseMethod) {
    this.createSampleEntryCtor.call(this, mediaType, type, parseMethod, ['sinf']);
  }

  createSampleGroupCtor(type: string, parseMethod?: ParseMethod) {
    //BoxParser.sampleGroupEntryCodes.push(type);
    const prop = (type + 'SampleGroupEntry') as keyof _BoxParser;
    this[prop] = function (this: SampleGroupEntry, size: number) {
      this.size = size;
    };
    this[prop].prototype = new SampleGroupEntry(type);
    if (parseMethod) this[prop].prototype.parse = parseMethod;
  }

  createTrackGroupCtor(type: string, parseMethod?: ParseMethod) {
    //BoxParser.trackGroupTypes.push(type);
    const prop = (type + 'TrackGroupTypeBox') as keyof _BoxParser;
    this[prop] = function (this: TrackGroupTypeBox, size: number) {
      this.size = size;
    };
    this[prop].prototype = new TrackGroupTypeBox(type);
    if (parseMethod) this[prop].prototype.parse = parseMethod;
  }

  createUUIDbox(
    uuid: string,
    isFullBox: boolean,
    isContainerBox: boolean,
    parseMethod?: ParseMethod
  ) {
    this.UUIDs.push(uuid);
    let box: Box | FullBox | ContainerBox;
    if (isFullBox) box = new FullBox('uuid', 0, uuid);
    else if (isContainerBox) box = new ContainerBox('uuid', 0, uuid);
    else box = new Box('uuid', 0, uuid);

    this.UUIDBoxes[uuid] = function (size: number) {
      box.size = size;
      return box;
    };

    if (parseMethod) {
      if (isFullBox) {
        (box as FullBox).parse = function (stream: BoxStream) {
          this.parseFullHeader(stream);
          parseMethod.call(this, stream);
        };
      } else {
        box.parse = parseMethod;
      }
    }
  }

  parseUUID = box_parse.parseUUID;
  parseHex16 = box_parse.parseHex16;
  parseOnebox = box_parse.parseOneBox;

  DIFF_BOXES_PROP_NAMES = box_diff.DIFF_BOXES_PROP_NAMES;
  DIFF_PRIMITIVE_ARRAY_PROP_NAMES = box_diff.DIFF_PRIMITIVE_ARRAY_PROP_NAMES;
  boxEqual = box_diff.boxEqual;
  boxEqualFields = box_diff.boxEqualFields;

  decimalToHex(d?: number, padding?: number): string {
    var hex = Number(d).toString(16);
    padding = typeof padding === 'undefined' || padding === null ? (padding = 2) : padding;
    while (hex.length < padding) {
      hex = '0' + hex;
    }
    return hex;
  }

  TKHD_FLAG_ENABLED = 0x000001;
  TKHD_FLAG_IN_MOVIE = 0x000002;
  TKHD_FLAG_IN_PREVIEW = 0x000004;
  TFHD_FLAG_BASE_DATA_OFFSET = 0x01;
  TFHD_FLAG_SAMPLE_DESC = 0x02;
  TFHD_FLAG_SAMPLE_DUR = 0x08;
  TFHD_FLAG_SAMPLE_SIZE = 0x10;
  TFHD_FLAG_SAMPLE_FLAGS = 0x20;
  TFHD_FLAG_DUR_EMPTY = 0x10000;
  TFHD_FLAG_DEFAULT_BASE_IS_MOOF = 0x20000;
  TRUN_FLAGS_DATA_OFFSET = 0x01;
  TRUN_FLAGS_FIRST_FLAG = 0x04;
  TRUN_FLAGS_DURATION = 0x100;
  TRUN_FLAGS_SIZE = 0x200;
  TRUN_FLAGS_FLAGS = 0x400;
  TRUN_FLAGS_CTS_OFFSET = 0x800;
}

export class Box {
  [prop: string]: any;

  type: string;
  size: number;
  uuid?: string;
  start = 0;

  constructor(type?: string, size?: number, uuid?: string) {
    this.type = type ? type : '';
    this.size = size ? size : 0;
    this.uuid = uuid;
  }

  parse(stream: BoxStream) {
    return box_parse.Box.parse.call(this, stream);
  }

  parseDataAndRewind(stream: BoxStream) {
    return box_parse.Box.parseDataAndRewind.call(this, stream);
  }
  parseLanguage(stream: BoxStream) {
    return box_parse.Box.parseLanguage.call(this, stream);
  }

  printHeader(output: PrintOutput) {
    return box_print.Box.printHeader.call(this, output);
  }
  print(output: PrintOutput) {
    return box_print.Box.print.call(this, output);
  }

  writeHeader(stream: DataStream, msg?: string) {
    return box_write.Box.writeHeader.call(this, stream);
  }
  write(stream: DataStream) {
    return box_write.Box.write.call(this, stream);
  }

  set<P extends keyof this>(prop: P, value: this[P]) {
    this[prop] = value;
    return this;
  }

  add(name: string) {
    const Ctor = BoxParser[(name + 'Box') as keyof _BoxParser] as BoxCtor;
    return this.addbox(new Ctor());
  }

  addbox(box: Box) {
    this.boxes.push(box);
    const prop = (box.type + 's') as keyof Box;
    if (this[prop]) {
      this[prop].push(box);
    } else {
      this[box.type as keyof Box] = box as never;
    }
    return box;
  }

  addEntry(value: Box, _prop?: string) {
    var prop = (_prop || 'entries') as keyof Box;
    if (!this[prop]) {
      this[prop] = [] as never;
    }
    this[prop].push(value);
    return this;
  }

  computeSize(stream_?: DataStream) {
    var stream = stream_ || new DataStream();
    stream.endianness = DataStream.BIG_ENDIAN;
    this.write(stream);
  }

  unpack?: (samples: Sample[]) => void;
}

export class FullBox extends Box {
  version = 0;
  hdr_size = 0;
  constructor(type?: string, size?: number, uuid?: string) {
    super(type, size, uuid);
  }

  parseDataAndRewind(stream: BoxStream) {
    return box_parse.FullBox.parseDataAndRewind.call(this, stream);
  }
  parseFullHeader(stream: BoxStream) {
    return box_parse.FullBox.parseFullHeader.call(this, stream);
  }
  parse(stream: BoxStream) {
    return box_parse.FullBox.parse.call(this, stream);
  }

  printHeader(output: PrintOutput) {
    return box_print.FullBox.printHeader.call(this, output);
  }

  writeHeader(stream: MultiBufferStream) {
    return box_write.FullBox.writeHeader.call(this, stream);
  }
}

export class ContainerBox extends Box {
  boxes: Box[] = [];
  constructor(type?: string, size?: number, uuid?: string) {
    super(type, size, uuid);
  }
  parse(stream: BoxStream) {
    return box_parse.ContainerBox.parse.call(this, stream);
  }
  print(output: PrintOutput) {
    return box_print.ContainerBox.print.call(this, output);
  }
  write(stream: MultiBufferStream) {
    return box_write.ContainerBox.write.call(this, stream);
  }
}

export class SampleEntry extends ContainerBox {
  data_reference_index = 0;
  sizePosition = 0;
  constructor(type?: string, size?: number, hdr_size?: number, start?: number) {
    super(type, size);
    this.hdr_size = hdr_size ? hdr_size : 0;
    this.start = start ? start : 0;
  }

  isVideo() {
    return false;
  }

  isAudio() {
    return false;
  }

  isSubtitle() {
    return false;
  }

  isMetadata() {
    return false;
  }

  isHint() {
    return false;
  }

  getCodec() {
    return this.type.replace('.', '');
  }

  getWidth(): number | string {
    return '';
  }

  getHeight(): number | string {
    return '';
  }

  getChannelCount(): number | string {
    return '';
  }

  getSampleRate(): number | string {
    return '';
  }

  getSampleSize(): number | string {
    return '';
  }

  parseHeader(stream: BoxStream) {
    stream.readUint8Array(6);
    this.data_reference_index = stream.readUint16();
    this.hdr_size += 8;
  }

  parse(stream: BoxStream) {
    this.parseHeader(stream);
    this.data = stream.readUint8Array(this.size - this.hdr_size);
  }

  parseDataAndRewind(stream: BoxStream) {
    this.parseHeader(stream);
    this.data = stream.readUint8Array(this.size - this.hdr_size);
    // restore the header size as if the sample entry header had not been parsed
    this.hdr_size -= 8;
    // rewinding
    stream.position -= this.size - this.hdr_size;
  }

  parseFooter(stream: BoxStream) {
    box_parse.ContainerBox.parse.call(this, stream);
  }

  writeHeader(stream: MultiBufferStream) {
    this.size = 8;
    box_write.Box.writeHeader.call(this, stream);
    stream.writeUint8(0);
    stream.writeUint8(0);
    stream.writeUint8(0);
    stream.writeUint8(0);
    stream.writeUint8(0);
    stream.writeUint8(0);
    stream.writeUint16(this.data_reference_index || 0);
  }

  writeFooter(stream: MultiBufferStream) {
    for (var i = 0; i < this.boxes.length; i++) {
      this.boxes[i].write(stream);
      this.size += this.boxes[i].size;
    }
    Log.debug('BoxWriter', 'Adjusting box ' + this.type + ' with new size ' + this.size);
    stream.adjustUint32(this.sizePosition, this.size);
  }

  write(stream: MultiBufferStream) {
    this.writeHeader(stream);
    stream.writeUint8Array(this.data);
    this.size += this.data.length;
    Log.debug('BoxWriter', 'Adjusting box ' + this.type + ' with new size ' + this.size);
    stream.adjustUint32(this.sizePosition, this.size);
  }
}

export class SampleGroupEntry extends Box {
  grouping_type?: string;
  description_length?: number;
  entries: SampleEntry[] = [];
  constructor(type?: string, size?: number) {
    super(type, size);
    this.grouping_type = type;
  }

  parse(stream: BoxStream) {
    Log.warn('BoxParser', 'Unknown Sample Group type: ' + this.grouping_type);
    this.data = stream.readUint8Array(this.description_length);
  }

  write(stream: MultiBufferStream) {
    stream.writeUint8Array(this.data);
  }
}

export class TrackGroupTypeBox extends FullBox {
  constructor(type?: string, size?: number) {
    super(type, size);
  }
}

export const BoxParser = (() => {
  const parser = new _BoxParser();
  parsing(parser);
  box_codec(parser);
  writing(parser);
  box_unpack(parser);
  return parser;
})();
