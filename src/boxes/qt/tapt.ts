import { ContainerBox } from '#/box';
import { clefBox } from '#/boxes/qt/clef';
import { enofBox } from '#/boxes/qt/enof';
import { profBox } from '#/boxes/qt/prof';

export class taptBox extends ContainerBox {
  type = 'tapt' as const;

  clef: Array<clefBox> = [];
  prof: Array<profBox> = [];
  enof: Array<enofBox> = [];
  subBoxNames = ['clef', 'prof', 'enof'] as const;
}
