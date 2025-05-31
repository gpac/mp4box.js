import { SampleGroupEntry } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { Log } from '#/log';

export class scnmSampleGroupEntry extends SampleGroupEntry {
  static grouping_type = 'scnm' as const;

  parse(_stream: MultiBufferStream) {
    Log.warn('BoxParser', 'Sample Group type: ' + this.grouping_type + ' not fully parsed');
  }
}
