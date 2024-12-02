import { ContainerBox } from '#/box';
import { clefBox } from '#/boxes/qt/clef';
import { enofBox } from '#/boxes/qt/enof';
import { profBox } from '#/boxes/qt/prof';

export class taptBox extends ContainerBox {
  clef: Array<clefBox> = [];
  prof: Array<profBox> = [];
  enof: Array<enofBox> = [];
  subBoxNames = ['clef', 'prof', 'enof'] as const;

  type = 'tapt' as const;
}
