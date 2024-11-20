import { ContainerBox } from '#/box';
import { clefBox } from './clef';
import { enofBox } from './enof';
import { profBox } from './prof';

export class taptBox extends ContainerBox {
  clef: Array<clefBox> = [];
  prof: Array<profBox> = [];
  enof: Array<enofBox> = [];
  subBoxNames = ['clef', 'prof', 'enof'] as const;

  constructor(size?: number) {
    super('tapt', size);
  }
}
