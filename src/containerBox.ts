import type { BoxKind, Output } from '@types';
import type { MultiBufferStream } from '#/buffer';
import { Box } from '#/box';
import { Log } from '#/log';
import { OK } from '#/constants';
import { parseOneBox } from '#/parser';

export class ContainerBox extends Box {
  subBoxNames?: ReadonlyArray<string>;

  /** @bundle box-write.js */
  write(stream: MultiBufferStream) {
    this.size = 0;
    this.writeHeader(stream);
    if (this.boxes) {
      for (let i = 0; i < this.boxes.length; i++) {
        if (this.boxes[i]) {
          this.boxes[i].write(stream);
          this.size += this.boxes[i].size;
        }
      }
    }
    /* adjusting the size, now that all sub-boxes are known */
    Log.debug('BoxWriter', 'Adjusting box ' + this.type + ' with new size ' + this.size);
    stream.adjustUint32(this.sizePosition, this.size);
  }

  /** @bundle box-print.js */
  print(output: Output) {
    this.printHeader(output);
    for (let i = 0; i < this.boxes.length; i++) {
      if (this.boxes[i]) {
        const prev_indent = output.indent;
        output.indent += ' ';
        this.boxes[i].print(output);
        output.indent = prev_indent;
      }
    }
  }

  /** @bundle box-parse.js */
  parse(stream: MultiBufferStream) {
    let ret: ReturnType<typeof parseOneBox>;
    while (stream.getPosition() < this.start + this.size) {
      ret = parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
      if (ret.code === OK) {
        const box = ret.box as BoxKind;
        if (!this.boxes) {
          this.boxes = [];
        }
        /* store the box in the 'boxes' array to preserve box order (for offset) but also store box in a property for more direct access */
        this.boxes.push(box);
        if (this.subBoxNames && this.subBoxNames.indexOf(box.type) !== -1) {
          const fourcc = this.subBoxNames[this.subBoxNames.indexOf(box.type)] + 's';
          if (!this[fourcc]) this[fourcc] = [];
          this[fourcc].push(box);
        } else {
          const box_type = box.type !== 'uuid' ? box.type : box.uuid;
          if (this[box_type]) {
            Log.warn(
              'ContainerBox',
              `Box of type ${box_type} already exists in container box ${this.type}.`,
            );
          } else {
            this[box_type] = box;
          }
        }
      } else {
        return;
      }
    }
  }
}
