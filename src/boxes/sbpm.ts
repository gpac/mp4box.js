import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

class Pixel {
  constructor(public bad_pixel_row: number, public bad_pixel_column: number) {}
  toString() {
    return '[row: ' + this.bad_pixel_row + ', column: ' + this.bad_pixel_column + ']';
  }
}

export class sbpmBox extends FullBox {
  component_count: number;
  component_index: Array<number>;
  correction_applied: boolean;
  num_bad_rows: number;
  num_bad_cols: number;
  num_bad_pixels: number;
  bad_rows: Array<number>;
  bad_columns: Array<number>;
  bad_pixels: Pixel[];

  type = 'sbpm' as const;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.component_count = stream.readUint16();
    this.component_index = [];
    for (let i = 0; i < this.component_count; i++) {
      this.component_index.push(stream.readUint16());
    }
    const flags = stream.readUint8();
    this.correction_applied = 0x80 == (flags & 0x80);
    this.num_bad_rows = stream.readUint32();
    this.num_bad_cols = stream.readUint32();
    this.num_bad_pixels = stream.readUint32();
    this.bad_rows = [];
    this.bad_columns = [];
    this.bad_pixels = [];
    for (let i = 0; i < this.num_bad_rows; i++) {
      this.bad_rows.push(stream.readUint32());
    }
    for (let i = 0; i < this.num_bad_cols; i++) {
      this.bad_columns.push(stream.readUint32());
    }
    for (let i = 0; i < this.num_bad_pixels; i++) {
      let row = stream.readUint32();
      let col = stream.readUint32();
      this.bad_pixels.push(new Pixel(row, col));
    }
  }
}
