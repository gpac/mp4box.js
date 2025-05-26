import { ContainerBox, FullBox } from '#/box';
import type { dinfBox, grplBox, idatBox, iproBox, iprpBox } from '#/boxes/defaults';
import type { hdlrBox } from '#/boxes/hdlr';
import type { iinfBox } from '#/boxes/iinf';
import type { ilocBox } from '#/boxes/iloc';
import type { irefBox } from '#/boxes/iref';
import type { pitmBox } from '#/boxes/pitm';
import type { MultiBufferStream } from '#/buffer';

export class metaBox extends FullBox {
  type = 'meta' as const;
  box_name = 'MetaBox';

  hdlr: hdlrBox;
  hdlrs: hdlrBox[];
  iinf: iinfBox;
  iinfs: iinfBox[];
  idat: idatBox;
  idats: idatBox[];
  ipro: iproBox;
  ipros: iproBox[];
  grpl: grplBox;
  grpls: grplBox[];
  iloc: ilocBox;
  ilocs: ilocBox[];
  iprp: iprpBox;
  iprps: iprpBox[];
  pitm: pitmBox;
  pitms: pitmBox[];
  iref: irefBox;
  irefs: irefBox[];
  dinf: dinfBox;
  dinfs: dinfBox[];

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.boxes = [];
    ContainerBox.prototype.parse.call(this, stream);
  }
}
