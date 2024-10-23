import { SampleGroupEntry } from '../../box';
import { MultiBufferStream } from '../../buffer';
import { Log } from '../../log';

export class dtrtSampleGroupEntry extends SampleGroupEntry {
  parse(stream: MultiBufferStream) {
    Log.warn('BoxParser', 'Sample Group type: ' + this.grouping_type + ' not fully parsed');
  }
}
