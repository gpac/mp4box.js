import { ContainerBox } from '#/containerBox';

export class waveBox extends ContainerBox {
  static override readonly fourcc = 'wave' as const;
  box_name = 'siDecompressionParamBox' as const;
}
