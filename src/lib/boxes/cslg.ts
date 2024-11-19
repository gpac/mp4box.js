import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class cslgBox extends FullBox {
  compositionToDTSShift?: number;
  leastDecodeToDisplayDelta?: number;
  greatestDecodeToDisplayDelta?: number;
  compositionStartTime?: number;
  compositionEndTime?: number;

  constructor(size?: number) {
    super('cslg', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.version === 0) {
      this.compositionToDTSShift = stream.readInt32(); /* signed */
      this.leastDecodeToDisplayDelta = stream.readInt32(); /* signed */
      this.greatestDecodeToDisplayDelta = stream.readInt32(); /* signed */
      this.compositionStartTime = stream.readInt32(); /* signed */
      this.compositionEndTime = stream.readInt32(); /* signed */
    }
  }

  /** @bundle writing/cslg.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    this.flags = 0;
    this.size = 4 * 5;
    this.writeHeader(stream);
    stream.writeInt32(this.compositionToDTSShift);
    stream.writeInt32(this.leastDecodeToDisplayDelta);
    stream.writeInt32(this.greatestDecodeToDisplayDelta);
    stream.writeInt32(this.compositionStartTime);
    stream.writeInt32(this.compositionEndTime);
  }
}
