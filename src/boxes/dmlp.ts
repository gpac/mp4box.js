import { Box } from '#/box';
import { Log } from '#/log';
import type { MultiBufferStream } from '#/buffer';

export class dmlpBox extends Box {
  static override readonly fourcc = 'dmlp' as const;
  box_name = 'MLPSpecificBox' as const;

  format_info: number;
  peak_data_rate: number;

  parse(stream: MultiBufferStream) {
    this.format_info = stream.readUint16();
    const tmp_16 = stream.readUint16();
    this.peak_data_rate = tmp_16 >> 1;
    let reserved = tmp_16 & 0x1;
    if (reserved !== 0) {
      Log.error('BoxParser', 'dmlp reserved parsing problem', stream.isofile);
      return;
    }
    reserved = stream.readUint32();
    if (reserved !== 0) {
      Log.error('BoxParser', 'dmlp reserved parsing problem', stream.isofile);
    }
  }
}
