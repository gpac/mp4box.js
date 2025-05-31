import { SampleGroupEntry } from '#//box';
import { Log } from '#//log';
import type { MultiBufferStream } from '#/buffer';

export class viprSampleGroupEntry extends SampleGroupEntry {
  static grouping_type = 'vipr' as const;

  parse(_stream: MultiBufferStream) {
    Log.warn('BoxParser', 'Sample Group type: ' + this.grouping_type + ' not fully parsed');
  }
}
