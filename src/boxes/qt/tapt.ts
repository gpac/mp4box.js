import { ContainerBox } from '#/box';
import type { clefBox } from '#/boxes/qt/clef';
import type { enofBox } from '#/boxes/qt/enof';
import type { profBox } from '#/boxes/qt/prof';

export class taptBox extends ContainerBox {
  type = 'tapt' as const;
  box_name = 'TrackApertureModeDimensionsBox';

  clef: clefBox[] = [];
  prof: profBox[] = [];
  enof: enofBox[] = [];
  subBoxNames = ['clef', 'prof', 'enof'] as const;
}
