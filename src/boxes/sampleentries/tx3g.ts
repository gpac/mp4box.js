import type { MultiBufferStream } from '#/buffer';
import { SubtitleSampleEntry } from './base';

export class tx3gSampleEntry extends SubtitleSampleEntry {
  displayFlags: number;
  horizontal_justification: number;
  vertical_justification: number;
  bg_color_rgba: Uint8Array;
  box_record: Int16Array;
  style_record: Uint8Array;

  constructor(size?: number) {
    super('tx3g', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseHeader(stream);
    this.displayFlags = stream.readUint32();
    this.horizontal_justification = stream.readInt8();
    this.vertical_justification = stream.readInt8();
    this.bg_color_rgba = stream.readUint8Array(4);
    this.box_record = stream.readInt16Array(4);
    this.style_record = stream.readUint8Array(12);
    this.parseFooter(stream);
  }
}
