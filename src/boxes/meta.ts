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
  hdlrs: Array<hdlrBox>;
  iinf: iinfBox;
  iinfs: Array<iinfBox>;
  idat: idatBox;
  idats: Array<idatBox>;
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

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.boxes = [];
    ContainerBox.prototype.parse.call(this, stream);
  }
}
