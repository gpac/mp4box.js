import { SampleGroupEntry } from '#//box';
import { Log } from '#//log';
import { MultiBufferStream } from '#/buffer';

export class viprSampleGroupEntry extends SampleGroupEntry {
  parse(stream: MultiBufferStream) {
    Log.warn('BoxParser', 'Sample Group type: ' + this.grouping_type + ' not fully parsed');
  }
}