import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class vmhdBox extends FullBox {
  static override fourcc = 'vmhd' as const;
  box_name = 'VideoMediaHeaderBox' as const;

  graphicsmode: number;
  opcolor: Uint16Array | [number, number, number];

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.graphicsmode = stream.readUint16();
    this.opcolor = stream.readUint16Array(3);
  }

  /** @bundle writing/vmhd.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    this.flags = 1;
    this.size = 8;
    this.writeHeader(stream);
    stream.writeUint16(this.graphicsmode);
    stream.writeUint16Array(this.opcolor);
  }
}
