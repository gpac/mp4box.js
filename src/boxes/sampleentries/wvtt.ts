import type { MultiBufferStream } from '#/buffer';
import { MetadataSampleEntry } from './base';

export class wvttSampleEntry extends MetadataSampleEntry {
  constructor(size?: number) {
    super('wvtt', size);
  }

  parse(stream: MultiBufferStream): void {
    this.parseHeader(stream);
    this.parseFooter(stream);
  }
}
