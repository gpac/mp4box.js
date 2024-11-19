import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';

class Pixel {
  constructor(public bad_pixel_row: number, public bad_pixel_column: number) {}
  toString() {
    return '[row: ' + this.bad_pixel_row + ', column: ' + this.bad_pixel_column + ']';
  }
}

export class sbpmBox extends FullBox {
  component_count?: number;
  component_index?: number[];
  correction_applied?: boolean;
  num_bad_rows?: number;
  num_bad_cols?: number;
  num_bad_pixels?: number;
  bad_rows?: number[];
  bad_columns?: number[];
  bad_pixels?: Pixel[];

  constructor(size?: number) {
    super('sbpm', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    var i;
    this.component_count = stream.readUint16();
    this.component_index = [];
    for (i = 0; i < this.component_count; i++) {
      this.component_index.push(stream.readUint16());
    }
    var flags = stream.readUint8();
    this.correction_applied = 0x80 == (flags & 0x80);
    this.num_bad_rows = stream.readUint32();
    this.num_bad_cols = stream.readUint32();
    this.num_bad_pixels = stream.readUint32();
    this.bad_rows = [];
    this.bad_columns = [];
    this.bad_pixels = [];
    for (i = 0; i < this.num_bad_rows; i++) {
      this.bad_rows.push(stream.readUint32());
    }
    for (i = 0; i < this.num_bad_cols; i++) {
      this.bad_columns.push(stream.readUint32());
    }
    for (i = 0; i < this.num_bad_pixels; i++) {
      var row = stream.readUint32();
      var col = stream.readUint32();
      this.bad_pixels.push(new Pixel(row, col));
    }
  }
}
