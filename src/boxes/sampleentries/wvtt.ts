import type { MultiBufferStream } from '#/buffer';
import { MetadataSampleEntry } from './base';

export class wvttSampleEntry extends MetadataSampleEntry {
  type = 'wvtt' as const;

  parse(stream: MultiBufferStream): void {
    this.parseHeader(stream);
    this.parseFooter(stream);
  }
}
