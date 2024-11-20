import { MultiBufferStream } from '#/buffer';
import { SubtitleSampleEntry } from './sampleentry';

export class stxtSampleEntry extends SubtitleSampleEntry {
  content_encoding: string;
  mime_format: string;

  constructor(size?: number) {
    super('stxt', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseHeader(stream);
    this.content_encoding = stream.readCString();
    this.mime_format = stream.readCString();
    this.parseFooter(stream);
  }

  getCodec() {
    const baseCodec = super.getCodec();
    if (this.mime_format) {
      return baseCodec + '.' + this.mime_format;
    } else {
      return baseCodec;
    }
  }
}
