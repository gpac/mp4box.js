import { SampleGroupEntry } from '#//box';
import { Log } from '#//log';
import type { MultiBufferStream } from '#/buffer';

export class stsaSampleGroupEntry extends SampleGroupEntry {
  parse(stream: MultiBufferStream) {
    Log.warn('BoxParser', 'Sample Group type: ' + this.grouping_type + ' not fully parsed');
  }
}
