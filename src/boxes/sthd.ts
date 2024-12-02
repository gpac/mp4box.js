import { FullBox } from '#/box';

export class sthdBox extends FullBox {
  type = 'sthd' as const;
  constructor(size?: number) {
    super(size);
  }
}
