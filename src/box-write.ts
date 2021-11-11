import { DataStream } from 'src/DataStream';

/*
 * Copyright (c) Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */

import { BoxParser, Box, FullBox, ContainerBox } from './box';
import { MultiBufferStream } from './buffer';
import { Log } from './log';

var MAX_SIZE = Math.pow(2, 32);

export default {
  Box: {
    writeHeader: function (this: Box, stream: DataStream, msg?: string) {
      this.size += 8;
      if (this.size > MAX_SIZE) {
        this.size += 8;
      }
      if (this.type === 'uuid') {
        this.size += 16;
      }
      Log.debug(
        'BoxWriter',
        'Writing box ' +
          this.type +
          ' of size: ' +
          this.size +
          ' at position ' +
          stream.getPosition() +
          (msg || '')
      );
      if (this.size > MAX_SIZE) {
        stream.writeUint32(1);
      } else {
        this.sizePosition = stream.getPosition();
        stream.writeUint32(this.size);
      }
      stream.writeString(this.type, undefined, 4);
      if (this.type === 'uuid') {
        stream.writeUint8Array(this.uuid as unknown as Uint8Array);
      }
      if (this.size > MAX_SIZE) {
        stream.writeUint64(this.size);
      }
    },
    write: function (this: Box, stream: DataStream) {
      if (this.type === 'mdat') {
        /* TODO: fix this */
        if (this.data) {
          this.size = this.data.length;
          this.writeHeader(stream);
          stream.writeUint8Array(this.data);
        }
      } else {
        this.size = this.data ? this.data.length : 0;
        this.writeHeader(stream);
        if (this.data) {
          stream.writeUint8Array(this.data);
        }
      }
    },
  },

  FullBox: {
    writeHeader: function (this: FullBox, stream: MultiBufferStream) {
      this.size += 4;
      BoxParser.Box.prototype.writeHeader.call(
        this,
        stream,
        ' v=' + this.version + ' f=' + this.flags
      );
      stream.writeUint8(this.version);
      stream.writeUint24(this.flags);
    },
  },
  ContainerBox: {
    write: function (this: ContainerBox, stream: MultiBufferStream) {
      this.size = 0;
      this.writeHeader(stream);
      for (var i = 0; i < this.boxes.length; i++) {
        if (this.boxes[i]) {
          this.boxes[i].write(stream);
          this.size += this.boxes[i].size;
        }
      }
      /* adjusting the size, now that all sub-boxes are known */
      Log.debug('BoxWriter', 'Adjusting box ' + this.type + ' with new size ' + this.size);
      stream.adjustUint32(this.sizePosition, this.size);
    },
  },
  TrackReferenceTypeBox: {
    write: function (this: Box, stream: MultiBufferStream) {
      this.size = this.track_ids.length * 4;
      this.writeHeader(stream);
      stream.writeUint32Array(new Uint32Array(this.track_ids));
    },
  },
};
