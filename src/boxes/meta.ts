import { FullBox } from '#/box';
import { dinfBox, grplBox, idatBox, iproBox, iprpBox } from '#/boxes/defaults';
import { hdlrBox } from '#/boxes/hdlr';
import { iinfBox } from '#/boxes/iinf';
import { ilocBox } from '#/boxes/iloc';
import { irefBox } from '#/boxes/iref';
import { pitmBox } from '#/boxes/pitm';
import type { MultiBufferStream } from '#/buffer';
import { ContainerBox } from '#/containerBox';

export class metaBox extends FullBox {
  static override readonly fourcc = 'meta' as const;
  box_name = 'MetaBox' as const;

  isQT = false; // Flag to indicate if this is a QT meta box

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
    const pos = stream.getPosition();

    // Try to check if this is a QT meta box
    if (this.size > 8) {
      stream.readUint32(); // Skip size
      const qtType = stream.readString(4);
      switch (qtType) {
        case 'hdlr':
        case 'mhdr':
        case 'keys':
        case 'ilst':
        case 'ctry':
        case 'lang':
          this.isQT = true;
          break;
        default:
          break;
      }
      stream.seek(pos);
    }

    // meta is a FullBox in MPEG-4 and a ContainerBox in QTFF
    if (!this.isQT) this.parseFullHeader(stream);
    ContainerBox.prototype.parse.call(this, stream);
  }
}
