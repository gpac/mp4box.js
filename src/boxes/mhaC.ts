import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { Log } from '#/log';

export class mhaCBox extends Box {
  static override readonly fourcc = 'mhaC' as const;
  box_name = 'MHAConfigurationBox' as const;

  configurationVersion: number;
  mpegh3daProfileLevelIndication: number;
  referenceChannelLayout: number;
  mpegh3daConfigLength: number;
  mpegh3daConfig: Uint8Array;

  parse(stream: MultiBufferStream) {
    this.configurationVersion = stream.readUint8();
    if (this.configurationVersion !== 1) {
      Log.error(
        'BoxParser',
        'mhaC version ' + this.configurationVersion + ' not supported',
        stream.isofile,
      );
      return;
    }
    this.mpegh3daProfileLevelIndication = stream.readUint8();
    this.referenceChannelLayout = stream.readUint8();
    this.mpegh3daConfigLength = stream.readUint16();
    this.mpegh3daConfig = stream.readUint8Array(this.mpegh3daConfigLength);
  }
}
