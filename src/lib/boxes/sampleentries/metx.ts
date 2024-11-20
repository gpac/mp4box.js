import { MultiBufferStream } from '#/buffer';
import { MetadataSampleEntry } from './sampleentry';

export class metxSampleEntry extends MetadataSampleEntry {
  content_encoding?: string;
  namespace?: string;
  schema_location?: string;

  constructor(size: number) {
    super('metx', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseHeader(stream);
    this.content_encoding = stream.readCString();
    this.namespace = stream.readCString();
    this.schema_location = stream.readCString();
    this.parseFooter(stream);
  }
}