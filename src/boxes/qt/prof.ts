import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class profBox extends FullBox {
  width: number;
  height: number;

  type = 'prof' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.width = stream.readUint32();
    this.height = stream.readUint32();
  }
}
