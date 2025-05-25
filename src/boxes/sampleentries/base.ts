import { ContainerBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { Log } from '#/log';
import type { avcCBox } from '../avcC';
import type { hvcCBox } from '../hvcC';

export class SampleEntry extends ContainerBox {
  data_reference_index?: number;

  constructor(
    size?: number,
    public hdr_size?: number,
    public start?: number,
  ) {
    super(size);
  }

  /** @bundle box-codecs.js */
  isVideo() {
    return false;
  }

  /** @bundle box-codecs.js */
  isAudio() {
    return false;
  }

  /** @bundle box-codecs.js */
  isSubtitle() {
    return false;
  }

  /** @bundle box-codecs.js */
  isMetadata() {
    return false;
  }

  /** @bundle box-codecs.js */
  isHint() {
    return false;
  }

  /** @bundle box-codecs.js */
  getCodec() {
    return this.type.replace('.', '');
  }

  /** @bundle box-codecs.js */
  getWidth(): number {
    // @ts-expect-error FIXME: Only stubbed? Expects a number returned.
    return '';
  }

  /** @bundle box-codecs.js */
  getHeight(): number {
    // @ts-expect-error FIXME: Only stubbed? Expects a number returned.
    return '';
  }

  /** @bundle box-codecs.js */
  getChannelCount(): number {
    // @ts-expect-error FIXME: Only stubbed? Expects a number returned.
    return '';
  }

  /** @bundle box-codecs.js */
  getSampleRate(): number {
    // @ts-expect-error FIXME: Only stubbed? Expects a number returned.
    return '';
  }

  /** @bundle box-codecs.js */
  getSampleSize(): number {
    // @ts-expect-error FIXME: Only stubbed? Expects a number returned.
    return '';
  }

  /** @bundle parsing/sampleentries/sampleentry.js */
  parseHeader(stream: MultiBufferStream) {
    stream.readUint8Array(6);
    this.data_reference_index = stream.readUint16();
    this.hdr_size += 8;
  }

  /** @bundle parsing/sampleentries/sampleentry.js */
  parse(stream: MultiBufferStream) {
    this.parseHeader(stream);
    this.data = stream.readUint8Array(this.size - this.hdr_size);
  }

  /** @bundle parsing/sampleentries/sampleentry.js */
  parseDataAndRewind(stream: MultiBufferStream) {
    this.parseHeader(stream);
    this.data = stream.readUint8Array(this.size - this.hdr_size);
    // restore the header size as if the sample entry header had not been parsed
    this.hdr_size -= 8;
    // rewinding
    stream.position -= this.size - this.hdr_size;
  }

  /** @bundle parsing/sampleentries/sampleentry.js */
  parseFooter(stream: MultiBufferStream) {
    super.parse(stream);
  }

  /** @bundle writing/sampleentry.js */
  writeHeader(stream: MultiBufferStream) {
    this.size = 8;
    super.writeHeader(stream);
    stream.writeUint8(0);
    stream.writeUint8(0);
    stream.writeUint8(0);
    stream.writeUint8(0);
    stream.writeUint8(0);
    stream.writeUint8(0);
    stream.writeUint16(this.data_reference_index);
  }

  /** @bundle writing/sampleentry.js */
  writeFooter(stream: MultiBufferStream) {
    for (let i = 0; i < this.boxes.length; i++) {
      this.boxes[i].write(stream);
      this.size += this.boxes[i].size;
    }
    Log.debug('BoxWriter', 'Adjusting box ' + this.type + ' with new size ' + this.size);
    stream.adjustUint32(this.sizePosition, this.size);
  }

  /** @bundle writing/sampleentry.js */
  write(stream: MultiBufferStream) {
    this.writeHeader(stream);
    stream.writeUint8Array(this.data);
    this.size += this.data.length;
    Log.debug('BoxWriter', 'Adjusting box ' + this.type + ' with new size ' + this.size);
    stream.adjustUint32(this.sizePosition, this.size);
  }
}

// Base SampleEntry types with default parsing
export class HintSampleEntry extends SampleEntry {}
export class MetadataSampleEntry extends SampleEntry {
  /** @bundle box-codecs.js */
  isMetadata() {
    return true;
  }
}
export class SubtitleSampleEntry extends SampleEntry {
  /** @bundle box-codecs.js */
  isSubtitle() {
    return true;
  }
}
export class SystemSampleEntry extends SampleEntry {}
export class TextSampleEntry extends SampleEntry {}

//Base SampleEntry types for Audio and Video with specific parsing
export class VisualSampleEntry extends SampleEntry {
  avcC?: avcCBox;
  avcCs?: Array<avcCBox>;
  hvcC?: hvcCBox;
  hvcCs?: Array<hvcCBox>;

  width: number;
  height: number;
  horizresolution: number;
  vertresolution: number;
  frame_count: number;
  compressorname: string;
  depth: number;

  parse(stream: MultiBufferStream) {
    this.parseHeader(stream);
    stream.readUint16();
    stream.readUint16();
    stream.readUint32Array(3);
    this.width = stream.readUint16();
    this.height = stream.readUint16();
    this.horizresolution = stream.readUint32();
    this.vertresolution = stream.readUint32();
    stream.readUint32();
    this.frame_count = stream.readUint16();
    const compressorname_length = Math.min(31, stream.readUint8());
    this.compressorname = stream.readString(compressorname_length);
    if (compressorname_length < 31) {
      stream.readString(31 - compressorname_length);
    }
    this.depth = stream.readUint16();
    stream.readUint16();
    this.parseFooter(stream);
  }

  /** @bundle box-codecs.js */
  isVideo() {
    return true;
  }

  /** @bundle box-codecs.js */
  getWidth() {
    return this.width;
  }

  /** @bundle box-codecs.js */
  getHeight() {
    return this.height;
  }

  /** @bundle writing/sampleentries/sampleentry.js */
  write(stream: MultiBufferStream) {
    this.writeHeader(stream);
    this.size += 2 * 7 + 6 * 4 + 32;
    stream.writeUint16(0);
    stream.writeUint16(0);
    stream.writeUint32(0);
    stream.writeUint32(0);
    stream.writeUint32(0);
    stream.writeUint16(this.width);
    stream.writeUint16(this.height);
    stream.writeUint32(this.horizresolution);
    stream.writeUint32(this.vertresolution);
    stream.writeUint32(0);
    stream.writeUint16(this.frame_count);
    stream.writeUint8(Math.min(31, this.compressorname.length));
    stream.writeString(this.compressorname, null, 31);
    stream.writeUint16(this.depth);
    stream.writeInt16(-1);
    this.writeFooter(stream);
  }
}

export class AudioSampleEntry extends SampleEntry {
  channel_count: number;
  samplesize: number;
  samplerate: number;

  parse(stream: MultiBufferStream) {
    this.parseHeader(stream);
    stream.readUint32Array(2);
    this.channel_count = stream.readUint16();
    this.samplesize = stream.readUint16();
    stream.readUint16();
    stream.readUint16();
    this.samplerate = stream.readUint32() / (1 << 16);
    this.parseFooter(stream);
  }

  /** @bundle box-codecs.js */
  isAudio() {
    return true;
  }

  /** @bundle box-codecs.js */
  getChannelCount() {
    return this.channel_count;
  }

  /** @bundle box-codecs.js */
  getSampleRate() {
    return this.samplerate;
  }

  /** @bundle box-codecs.js */
  getSampleSize() {
    return this.samplesize;
  }

  /** @bundle writing/sampleentry.js */
  write(stream: MultiBufferStream) {
    this.writeHeader(stream);
    this.size += 2 * 4 + 3 * 4;
    stream.writeUint32(0);
    stream.writeUint32(0);
    stream.writeUint16(this.channel_count);
    stream.writeUint16(this.samplesize);
    stream.writeUint16(0);
    stream.writeUint16(0);
    stream.writeUint32(this.samplerate << 16);
    this.writeFooter(stream);
  }
}
