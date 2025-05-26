import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

type Range = {
  level: number;
  range_size: number;
};
type SubSegment = {
  ranges: Array<Range>;
};

export class ssixBox extends FullBox {
  type = 'ssix' as const;
  box_name = 'CompressedSubsegmentIndexBox';

  subsegments: SubSegment[];

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.subsegments = [];
    const subsegment_count = stream.readUint32();
    for (let i = 0; i < subsegment_count; i++) {
      const subsegment = {} as SubSegment;
      this.subsegments.push(subsegment);
      subsegment.ranges = [];
      const range_count = stream.readUint32();
      for (let j = 0; j < range_count; j++) {
        const range = {} as Range;
        subsegment.ranges.push(range);
        range.level = stream.readUint8();
        range.range_size = stream.readUint24();
      }
    }
  }
}
