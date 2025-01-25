import { Box } from './box';
import { Stream } from './stream';

export class ctts extends Box {
  version: number;
  sample_counts: number[];
  sample_offsets: number[];

  constructor(size: number, type: string, hdr_size: number, start: number) {
    super(size, type, hdr_size, start);
    this.sample_counts = [];
    this.sample_offsets = [];
  }

  parse(stream: Stream): void {
    const entry_count = stream.readUint32();
    if (this.version === 0) {
      for (let i = 0; i < entry_count; i++) {
        this.sample_counts.push(stream.readUint32());
        const value = stream.readInt32();
        if (value < 0) {
          console.warn('ctts box uses negative values without using version 1');
        }
        this.sample_offsets.push(value);
      }
    } else if (this.version === 1) {
      for (let i = 0; i < entry_count; i++) {
        this.sample_counts.push(stream.readUint32());
        this.sample_offsets.push(stream.readInt32());
      }
    }
  }
}
