import { MultiBufferStream } from '#/buffer';
import { SampleGroupEntry } from '../../box';
import { Log } from '../../log';

export class viprSampleGroupEntry extends SampleGroupEntry {
  parse(stream: MultiBufferStream) {
    Log.warn('BoxParser', 'Sample Group type: ' + this.grouping_type + ' not fully parsed');
  }
}
