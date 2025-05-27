import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { Pixel } from './displays/pixel';

export class sbpmBox extends FullBox {
  type = 'sbpm' as const;
  box_name = 'SensorBadPixelsMapBox';

  component_count: number;
  component_index: Array<number>;
  correction_applied: boolean;
  num_bad_rows: number;
  num_bad_cols: number;
  num_bad_pixels: number;
  bad_rows: Array<number>;
  bad_columns: Array<number>;
  bad_pixels: Array<Pixel>;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.component_count = stream.readUint16();
    this.component_index = [];
    for (let i = 0; i < this.component_count; i++) {
      this.component_index.push(stream.readUint16());
    }
    const flags = stream.readUint8();
    this.correction_applied = 0x80 === (flags & 0x80);
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
      const row = stream.readUint32();
      const col = stream.readUint32();
      this.bad_pixels.push(new Pixel(row, col));
    }
  }
}
