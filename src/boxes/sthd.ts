import { FullBox } from '#/box';

export class sthdBox extends FullBox {
  static override fourcc = 'sthd' as const;
  box_name = 'SubtitleMediaHeaderBox' as const;
}
