import { Box, FullBox, parseOneBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { OK } from '#/constants';
import { Log } from '#/log';

export class drefBox extends FullBox {
  type = 'dref' as const;
  box_name = 'DataReferenceBox'

  entries: Array<Box>;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.entries = [];
    const entry_count = stream.readUint32();
    for (let i = 0; i < entry_count; i++) {
      let ret = parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
      if (ret.code === OK) {
        let box = ret.box;
        this.entries.push(box);
      } else {
        return;
      }
    }
  }

  /** @bundle writing/dref.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    this.flags = 0;
    this.size = 4; //
    this.writeHeader(stream);
    stream.writeUint32(this.entries.length);
    for (let i = 0; i < this.entries.length; i++) {
      this.entries[i].write(stream);
      this.size += this.entries[i].size;
    }
    /* adjusting the size, now that all sub-boxes are known */
    Log.debug('BoxWriter', 'Adjusting box ' + this.type + ' with new size ' + this.size);
    stream.adjustUint32(this.sizePosition, this.size);
  }
}
