import type { MultiBufferStream } from '#/buffer';
import { SubtitleSampleEntry } from './base';

export class stppSampleEntry extends SubtitleSampleEntry {
  namespace: string;
  schema_location: string;
  auxiliary_mime_types: string;

  constructor(size?: number) {
    super('stpp', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseHeader(stream);
    this.namespace = stream.readCString();
    this.schema_location = stream.readCString();
    this.auxiliary_mime_types = stream.readCString();
    this.parseFooter(stream);
  }

  /** @bundle writing/sampleentry.js */
  write(stream: MultiBufferStream) {
    this.writeHeader(stream);
    this.size +=
      this.namespace.length +
      1 +
      this.schema_location.length +
      1 +
      this.auxiliary_mime_types.length +
      1;
    stream.writeCString(this.namespace);
    stream.writeCString(this.schema_location);
    stream.writeCString(this.auxiliary_mime_types);
    this.writeFooter(stream);
  }
}
