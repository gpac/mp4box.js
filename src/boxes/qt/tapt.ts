import { ContainerBox } from '#/box';
import type { clefBox } from '#/boxes/qt/clef';
import type { enofBox } from '#/boxes/qt/enof';
import type { profBox } from '#/boxes/qt/prof';

export class taptBox extends ContainerBox {
  type = 'tapt' as const;
  box_name = 'TrackApertureModeDimensionsBox';

  clef: Array<clefBox> = [];
  prof: Array<profBox> = [];
  enof: Array<enofBox> = [];
  subBoxNames = ['clef', 'prof', 'enof'] as const;
}
