import { ContainerBox, FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';
import { dinfBox, grplBox, iproBox, iprpBox } from '#/parsing/defaults';
import { hdlrBox } from '#/parsing/hdlr';
import { iinfBox } from '#/parsing/iinf';
import { ilocBox } from '#/parsing/iloc';
import { irefBox } from './iref';
import { pitmBox } from './pitm';

export class metaBox extends FullBox {
  hdlr?: hdlrBox;
  iinf?: iinfBox;
  ipro?: iproBox;
  grpl?: grplBox;
  iloc?: ilocBox;
  iprp?: iprpBox;
  pitm?: pitmBox;
  iref?: irefBox;
  dinf?: dinfBox;

  constructor(size?: number) {
    super('meta', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.boxes = [];
    // TODO:  this s a bit weird and bug-prone: ContainerBox's parse-call could depend on properties not set by FullBox.
    ContainerBox.prototype.parse.call(this, stream);
  }
}
