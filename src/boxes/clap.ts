import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class clapBox extends Box {
  static override readonly fourcc = 'clap' as const;
  box_name = 'CleanApertureBox' as const;

  cleanApertureWidthN: number;
  cleanApertureWidthD: number;
  cleanApertureHeightN: number;
  cleanApertureHeightD: number;
  horizOffN: number;
  horizOffD: number;
  vertOffN: number;
  vertOffD: number;

  parse(stream: MultiBufferStream) {
    this.cleanApertureWidthN = stream.readUint32();
    this.cleanApertureWidthD = stream.readUint32();
    this.cleanApertureHeightN = stream.readUint32();
    this.cleanApertureHeightD = stream.readUint32();
    this.horizOffN = stream.readUint32();
    this.horizOffD = stream.readUint32();
    this.vertOffN = stream.readUint32();
    this.vertOffD = stream.readUint32();
  }
}
