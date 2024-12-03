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
  hdlrs: Array<hdlrBox>;
  iinf: iinfBox;
  iinfs: Array<iinfBox>;
  ipro: iproBox;
  ipros: Array<iproBox>;
  grpl: grplBox;
  grpls: Array<grplBox>;
  iloc: ilocBox;
  ilocs: Array<ilocBox>;
  iprp: iprpBox;
  iprps: Array<iprpBox>;
  pitm: pitmBox;
  pitms: Array<pitmBox>;
  iref: irefBox;
  irefs: Array<irefBox>;
  dinf: dinfBox;
  dinfs: Array<dinfBox>;

  type = 'meta' as const;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.boxes = [];
    ContainerBox.prototype.parse.call(this, stream);
  }
}
