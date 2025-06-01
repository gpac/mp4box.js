import type { MultiBufferStream } from '#/buffer';
import { SubtitleSampleEntry } from './base';

export class sbttSampleEntry extends SubtitleSampleEntry {
  content_encoding: string;
  mime_format: string;

  static override readonly fourcc = 'sbtt' as const;

  parse(stream: MultiBufferStream): void {
    this.parseHeader(stream);
    this.content_encoding = stream.readCString();
    this.mime_format = stream.readCString();
    this.parseFooter(stream);
  }
}
