import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { MAX_UINT32 } from '#/constants';
import type { Matrix } from '@types';

export class tkhdBox extends FullBox {
  static override readonly fourcc = 'tkhd' as const;
  box_name = 'TrackHeaderBox' as const;

  creation_time: number;
  modification_time: number;
  track_id: number;
  duration: number;
  layer = 0;
  alternate_group = 0;
  volume: number;
  matrix: Matrix;
  width: number;
  height: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.version === 1) {
      this.creation_time = stream.readUint64();
      this.modification_time = stream.readUint64();
      this.track_id = stream.readUint32();
      stream.readUint32();
      this.duration = stream.readUint64();
    } else {
      this.creation_time = stream.readUint32();
      this.modification_time = stream.readUint32();
      this.track_id = stream.readUint32();
      stream.readUint32();
      this.duration = stream.readUint32();
    }
    stream.readUint32Array(2);
    this.layer = stream.readInt16();
    this.alternate_group = stream.readInt16();
    this.volume = stream.readInt16() >> 8;
    stream.readUint16();
    this.matrix = stream.readInt32Array(9);
    this.width = stream.readUint32();
    this.height = stream.readUint32();
  }

  write(stream: MultiBufferStream) {
    const useVersion1 =
      this.modification_time > MAX_UINT32 ||
      this.creation_time > MAX_UINT32 ||
      this.duration > MAX_UINT32 ||
      this.version === 1;
    this.version = useVersion1 ? 1 : 0;

    this.size = 5 * 4 + 15 * 4; // 5x4 for header, 15x4 for fields
    this.size += useVersion1 ? 3 * 4 : 0; // creation_time, modification_time, duration

    this.flags = this.flags ?? 0x1 | 0x2; // track_enabled | track_in_movie
    this.writeHeader(stream);

    if (useVersion1) {
      stream.writeUint64(this.creation_time);
      stream.writeUint64(this.modification_time);
      stream.writeUint32(this.track_id);
      stream.writeUint32(0); // reserved
      stream.writeUint64(this.duration);
    } else {
      stream.writeUint32(this.creation_time);
      stream.writeUint32(this.modification_time);
      stream.writeUint32(this.track_id);
      stream.writeUint32(0); // reserved
      stream.writeUint32(this.duration);
    }
    stream.writeUint32Array([0, 0]); // reserved
    stream.writeInt16(this.layer);
    stream.writeInt16(this.alternate_group);
    stream.writeInt16(this.volume << 8); // volume in 0.256 units
    stream.writeInt16(0); // reserved
    stream.writeInt32Array(this.matrix); // 3x3 matrix
    stream.writeUint32(this.width);
    stream.writeUint32(this.height);
  }

  /** @bundle box-print.js */
  print(output: { log: (arg: string) => void; indent: string }) {
    super.printHeader(output);
    output.log(output.indent + 'creation_time: ' + this.creation_time);
    output.log(output.indent + 'modification_time: ' + this.modification_time);
    output.log(output.indent + 'track_id: ' + this.track_id);
    output.log(output.indent + 'duration: ' + this.duration);
    output.log(output.indent + 'volume: ' + (this.volume >> 8));
    output.log(output.indent + 'matrix: ' + this.matrix.join(', '));
    output.log(output.indent + 'layer: ' + this.layer);
    output.log(output.indent + 'alternate_group: ' + this.alternate_group);
    output.log(output.indent + 'width: ' + this.width);
    output.log(output.indent + 'height: ' + this.height);
  }
}
