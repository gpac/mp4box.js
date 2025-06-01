import type { MultiBufferStream } from '#/buffer';
import { MetadataSampleEntry } from './base';

export class metxSampleEntry extends MetadataSampleEntry {
  content_encoding: string;
  namespace: string;
  schema_location: string;

  static override readonly fourcc = 'metx' as const;

  parse(stream: MultiBufferStream) {
    this.parseHeader(stream);
    this.content_encoding = stream.readCString();
    this.namespace = stream.readCString();
    this.schema_location = stream.readCString();
    this.parseFooter(stream);
  }
}
