import { FullBox } from '../box';
import { BoxParser } from '../box-parser';
import type { MultiBufferStream } from '../buffer';

export class metaBox extends FullBox {
  constructor(size?: number) {
    super('meta', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.boxes = [];
    // TODO:  this s a bit weird and bug-prone: ContainerBox's parse-call could depend on properties not set by FullBox.
    BoxParser.ContainerBox.prototype.parse.call(this, stream);
  }
}
