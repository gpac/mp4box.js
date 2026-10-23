import { ContainerBox } from '#/containerBox';
import { esdsBox } from '#/boxes/esds';

export class waveBox extends ContainerBox {
  static override readonly fourcc = 'wave' as const;
  box_name = 'siDecompressionParamBox' as const;
  esds: esdsBox;
}
