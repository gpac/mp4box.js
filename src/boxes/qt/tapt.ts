import { ContainerBox } from '#/containerBox';
import { clefBox } from '#/boxes/qt/clef';
import { enofBox } from '#/boxes/qt/enof';
import { profBox } from '#/boxes/qt/prof';

export class taptBox extends ContainerBox {
  static override fourcc = 'tapt' as const;
  box_name = 'TrackApertureModeDimensionsBox' as const;

  clefs: Array<clefBox> = [];
  profs: Array<profBox> = [];
  enofs: Array<enofBox> = [];
  subBoxNames = ['clef', 'prof', 'enof'] as const;
}
