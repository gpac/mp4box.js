import { ContainerBox } from '#/box';
import { clefBox } from '#/boxes/qt/clef';
import { enofBox } from '#/boxes/qt/enof';
import { profBox } from '#/boxes/qt/prof';

export class taptBox extends ContainerBox {
  type = 'tapt' as const;
  box_name = 'TrackApertureModeDimensionsBox';

  clefs: Array<clefBox> = [];
  profs: Array<profBox> = [];
  enofs: Array<enofBox> = [];
  subBoxNames = ['clef', 'prof', 'enof'] as const;
}
