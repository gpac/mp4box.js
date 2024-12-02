import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

class ColorPoint {
  constructor(public x: number, public y: number) {}
  toString() {
    return '(' + this.x + ',' + this.y + ')';
  }
}

export class mdcvBox extends Box {
  display_primaries: Array<ColorPoint>;
  white_point: ColorPoint;
  max_display_mastering_luminance: number;
  min_display_mastering_luminance: number;

  type = 'mdcv' as const;

  parse(stream: MultiBufferStream) {
    this.display_primaries = [];
    this.display_primaries[0] = new ColorPoint(stream.readUint16(), stream.readUint16());
    this.display_primaries[1] = new ColorPoint(stream.readUint16(), stream.readUint16());
    this.display_primaries[2] = new ColorPoint(stream.readUint16(), stream.readUint16());
    this.white_point = new ColorPoint(stream.readUint16(), stream.readUint16());
    this.max_display_mastering_luminance = stream.readUint32();
    this.min_display_mastering_luminance = stream.readUint32();
  }
}
