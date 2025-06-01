import type { MultiBufferStream } from '#/buffer';
import { MetadataSampleEntry } from './base';

export class mettSampleEntry extends MetadataSampleEntry {
  content_encoding: string;
  mime_format: string;
  static override readonly fourcc = 'mett' as const;

  parse(stream: MultiBufferStream) {
    this.parseHeader(stream);
    this.content_encoding = stream.readCString();
    this.mime_format = stream.readCString();
    this.parseFooter(stream);
  }
}
