import { MetadataSampleEntry } from '#/boxes/sampleentries/sampleentry';
import type { MultiBufferStream } from '#/buffer';

export class wvttSampleEntry extends MetadataSampleEntry {
  constructor(size?: number) {
    super('wvtt', size);
  }

  parse(stream: MultiBufferStream): void {
    this.parseHeader(stream);
    this.parseFooter(stream);
  }
}
