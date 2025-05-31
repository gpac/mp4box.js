import { FullBox } from '#/box';

export class sthdBox extends FullBox {
  static fourcc = 'sthd' as const;
  box_name = 'SubtitleMediaHeaderBox' as const;
}
