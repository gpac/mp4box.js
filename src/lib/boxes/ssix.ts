import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';

interface Range {
  level: number;
  range_size: number;
}
interface SubSegment {
  ranges: Array<Range>;
}

export class ssixBox extends FullBox {
  subsegments?: SubSegment[];

  constructor(size?: number) {
    super('ssix', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.subsegments = [];
    var subsegment_count = stream.readUint32();
    for (var i = 0; i < subsegment_count; i++) {
      var subsegment = {} as SubSegment;
      this.subsegments.push(subsegment);
      subsegment.ranges = [];
      var range_count = stream.readUint32();
      for (var j = 0; j < range_count; j++) {
        var range = {} as Range;
        subsegment.ranges.push(range);
        range.level = stream.readUint8();
        range.range_size = stream.readUint24();
      }
    }
  }
}