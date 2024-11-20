import { ContainerBox, FullBox } from '#/box';
import { dinfBox, grplBox, iproBox, iprpBox } from '#/boxes/defaults';
import { hdlrBox } from '#/boxes/hdlr';
import { iinfBox } from '#/boxes/iinf';
import { ilocBox } from '#/boxes/iloc';
import { irefBox } from '#/boxes/iref';
import { pitmBox } from '#/boxes/pitm';
import type { MultiBufferStream } from '#/buffer';

export class metaBox extends FullBox {
  hdlr: hdlrBox;
  iinf: iinfBox;
  ipro: iproBox;
  grpl: grplBox;
  iloc: ilocBox;
  iprp: iprpBox;
  pitm: pitmBox;
  iref: irefBox;
  dinf: dinfBox;

  constructor(size?: number) {
    super('meta', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.boxes = [];
    ContainerBox.prototype.parse.call(this, stream);
  }
}
