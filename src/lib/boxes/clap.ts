import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class clapBox extends Box {
  cleanApertureWidthN?: number;
  cleanApertureWidthD?: number;
  cleanApertureHeightN?: number;
  cleanApertureHeightD?: number;
  horizOffN?: number;
  horizOffD?: number;
  vertOffN?: number;
  vertOffD?: number;

  constructor(size?: number) {
    super('clap', size);
  }

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
