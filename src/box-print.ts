/*
 * Copyright (c) Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */

var MAX_SIZE = Math.pow(2, 32);

import type { PrintOutput } from './types';
import { BoxParser, Box, FullBox, ContainerBox } from './box';
import { ISOFile } from './isofile';

export default {
  Box: {
    printHeader: function (this: Box, output: PrintOutput) {
      this.size += 8;
      if (this.size > MAX_SIZE) {
        this.size += 8;
      }
      if (this.type === 'uuid') {
        this.size += 16;
      }
      output.log(output.indent + 'size:' + this.size);
      output.log(output.indent + 'type:' + this.type);
    },
    print: function (this: Box, output: PrintOutput) {
      this.printHeader(output);
    },
  },
  FullBox: {
    printHeader: function (this: FullBox, output: PrintOutput) {
      this.size += 4;
      BoxParser.Box.prototype.printHeader.call(this, output);
      output.log(output.indent + 'version:' + this.version);
      output.log(output.indent + 'flags:' + this.flags);
    },
  },
  ContainerBox: {
    print: function (this: ContainerBox, output: PrintOutput) {
      this.printHeader(output);
      for (var i = 0; i < this.boxes.length; i++) {
        if (this.boxes[i]) {
          var prev_indent = output.indent;
          output.indent += ' ';
          this.boxes[i].print(output);
          output.indent = prev_indent;
        }
      }
    },
  },
  ISOFile: {
    print: function (this: ISOFile, output: PrintOutput) {
      output.indent = '';
      for (var i = 0; i < this.boxes.length; i++) {
        if (this.boxes[i]) {
          this.boxes[i].print(output);
        }
      }
    },
  },
  mvhdBox: {
    print: function (this: Box, output: PrintOutput) {
      BoxParser.FullBox.prototype.printHeader.call(this, output);
      output.log(output.indent + 'creation_time: ' + this.creation_time);
      output.log(output.indent + 'modification_time: ' + this.modification_time);
      output.log(output.indent + 'timescale: ' + this.timescale);
      output.log(output.indent + 'duration: ' + this.duration);
      output.log(output.indent + 'rate: ' + this.rate);
      output.log(output.indent + 'volume: ' + (this.volume >> 8));
      output.log(output.indent + 'matrix: ' + this.matrix.join(', '));
      output.log(output.indent + 'next_track_id: ' + this.next_track_id);
    },
  },
  tkhdBox: {
    print: function (this: Box, output: PrintOutput) {
      BoxParser.FullBox.prototype.printHeader.call(this, output);
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
    },
  },
};
