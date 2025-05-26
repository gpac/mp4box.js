import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import type { SubSample } from '@types';

interface SampleInfo {
  size: number;
  sample_delta: number;
  subsamples: SubSample[];
}

export class subsBox extends FullBox {
  type = 'subs' as const;
  box_name = 'SubSampleInformationBox';

  entries: SampleInfo[];

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    const entry_count = stream.readUint32();
    this.entries = [];
    let subsample_count;
    for (let i = 0; i < entry_count; i++) {
      const sampleInfo = {} as SampleInfo;
      this.entries[i] = sampleInfo;
      sampleInfo.sample_delta = stream.readUint32();
      sampleInfo.subsamples = [];
      subsample_count = stream.readUint16();
      if (subsample_count > 0) {
        for (let j = 0; j < subsample_count; j++) {
          const subsample = {} as SubSample;
          sampleInfo.subsamples.push(subsample);
          if (this.version === 1) {
            subsample.size = stream.readUint32();
          } else {
            subsample.size = stream.readUint16();
          }
          subsample.priority = stream.readUint8();
          subsample.discardable = stream.readUint8();
          subsample.codec_specific_parameters = stream.readUint32();
        }
      }
    }
  }
}
