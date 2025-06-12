import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { MAX_SIZE } from '#/constants';
import type { Matrix, Output } from '@types';

export class mvhdBox extends FullBox {
  static override readonly fourcc = 'mvhd' as const;
  box_name = 'MovieHeaderBox' as const;

  creation_time: number;
  modification_time: number;
  timescale: number;
  duration: number;
  rate: number;
  volume: number;
  next_track_id: number;
  matrix: Matrix;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.version === 1) {
      this.creation_time = stream.readUint64();
      this.modification_time = stream.readUint64();
      this.timescale = stream.readUint32();
      this.duration = stream.readUint64();
    } else {
      this.creation_time = stream.readUint32();
      this.modification_time = stream.readUint32();
      this.timescale = stream.readUint32();
      this.duration = stream.readUint32();
    }
    this.rate = stream.readUint32();
    this.volume = stream.readUint16() >> 8;
    stream.readUint16();
    stream.readUint32Array(2);
    this.matrix = stream.readUint32Array(9);
    stream.readUint32Array(6);
    this.next_track_id = stream.readUint32();
  }

  /** @bundle writing/mvhd.js */
  write(stream: MultiBufferStream) {
    const useVersion1 =
      this.modification_time > MAX_SIZE ||
      this.creation_time > MAX_SIZE ||
      this.duration > MAX_SIZE ||
      this.version === 1;
    this.version = useVersion1 ? 1 : 0;

    this.size = 4 * 4 + 20 * 4;
    this.size += useVersion1 ? 3 * 4 : 0; // creation_time, modification_time, duration

    this.flags = 0;
    this.writeHeader(stream);

    if (useVersion1) {
      stream.writeUint64(this.creation_time);
      stream.writeUint64(this.modification_time);
      stream.writeUint32(this.timescale);
      stream.writeUint64(this.duration);
    } else {
      stream.writeUint32(this.creation_time);
      stream.writeUint32(this.modification_time);
      stream.writeUint32(this.timescale);
      stream.writeUint32(this.duration);
    }
    stream.writeUint32(this.rate);
    stream.writeUint16(this.volume << 8);
    stream.writeUint16(0);
    stream.writeUint32(0);
    stream.writeUint32(0);
    stream.writeUint32Array(this.matrix);
    stream.writeUint32(0);
    stream.writeUint32(0);
    stream.writeUint32(0);
    stream.writeUint32(0);
    stream.writeUint32(0);
    stream.writeUint32(0);
    stream.writeUint32(this.next_track_id);
  }

  /** @bundle box-print.js */
  print(output: Output) {
    super.printHeader(output);
    output.log(output.indent + 'creation_time: ' + this.creation_time);
    output.log(output.indent + 'modification_time: ' + this.modification_time);
    output.log(output.indent + 'timescale: ' + this.timescale);
    output.log(output.indent + 'duration: ' + this.duration);
    output.log(output.indent + 'rate: ' + this.rate);
    output.log(output.indent + 'volume: ' + (this.volume >> 8));
    output.log(output.indent + 'matrix: ' + this.matrix.join(', '));
    output.log(output.indent + 'next_track_id: ' + this.next_track_id);
  }
}
