import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import type { Matrix } from '@types';

export class tkhdBox extends FullBox {
  creation_time: number;
  modification_time: number;
  track_id: number;
  duration: number;
  layer: number;
  alternate_group: number;
  volume: number;
  matrix: Matrix;
  width: number;
  height: number;

  type = 'tkhd' as const;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.version == 1) {
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
