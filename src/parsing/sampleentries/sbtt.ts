import { MultiBufferStream } from '../../buffer';
import { SubtitleSampleEntry } from './sampleentry';

export class sbttSampleEntry extends SubtitleSampleEntry {
  content_encoding?: string;
  mime_format?: string;

  constructor(size: number) {
    super('sbtt', size);
  }

  parse(stream: MultiBufferStream): void {
    this.parseHeader(stream);
    this.content_encoding = stream.readCString();
    this.mime_format = stream.readCString();
    this.parseFooter(stream);
  }
}
