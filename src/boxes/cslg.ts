import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

const INT32_MAX = 2_147_483_647;

export class cslgBox extends FullBox {
  type = 'cslg' as const;
  box_name = 'CompositionToDecodeBox';

  compositionToDTSShift: number;
  leastDecodeToDisplayDelta: number;
  greatestDecodeToDisplayDelta: number;
  compositionStartTime: number;
  compositionEndTime: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.version === 0) {
      this.compositionToDTSShift = stream.readInt32(); /* signed */
      this.leastDecodeToDisplayDelta = stream.readInt32(); /* signed */
      this.greatestDecodeToDisplayDelta = stream.readInt32(); /* signed */
      this.compositionStartTime = stream.readInt32(); /* signed */
      this.compositionEndTime = stream.readInt32(); /* signed */
    } else if (this.version === 1) {
      this.compositionToDTSShift = stream.readInt64(); /* signed */
      this.leastDecodeToDisplayDelta = stream.readInt64(); /* signed */
      this.greatestDecodeToDisplayDelta = stream.readInt64(); /* signed */
      this.compositionStartTime = stream.readInt64(); /* signed */
      this.compositionEndTime = stream.readInt64(); /* signed */
    }
  }

  /** @bundle writing/cslg.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    if ((this.compositionToDTSShift > INT32_MAX) ||
      (this.leastDecodeToDisplayDelta > INT32_MAX) ||
      (this.greatestDecodeToDisplayDelta > INT32_MAX) ||
      (this.compositionStartTime > INT32_MAX) ||
      (this.compositionEndTime > INT32_MAX)) {
      this.version = 1;
    }
    this.flags = 0;
    if (this.version === 0) {
      this.size = 4 * 5;
      this.writeHeader(stream);
      stream.writeInt32(this.compositionToDTSShift);
      stream.writeInt32(this.leastDecodeToDisplayDelta);
      stream.writeInt32(this.greatestDecodeToDisplayDelta);
      stream.writeInt32(this.compositionStartTime);
      stream.writeInt32(this.compositionEndTime);
    } else if (this.version === 1) {
      this.size = 8 * 5;
      this.writeHeader(stream);
      stream.writeInt64(this.compositionToDTSShift);
      stream.writeInt64(this.leastDecodeToDisplayDelta);
      stream.writeInt64(this.greatestDecodeToDisplayDelta);
      stream.writeInt64(this.compositionStartTime);
      stream.writeInt64(this.compositionEndTime);
    }
  }
}
