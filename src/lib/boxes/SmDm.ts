import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class SmDmBox extends FullBox {
  primaryRChromaticity_x?: number;
  primaryRChromaticity_y?: number;
  primaryGChromaticity_x?: number;
  primaryGChromaticity_y?: number;
  primaryBChromaticity_x?: number;
  primaryBChromaticity_y?: number;
  whitePointChromaticity_x?: number;
  whitePointChromaticity_y?: number;
  luminanceMax?: number;
  luminanceMin?: number;

  constructor(size?: number) {
    super('SmDm', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.primaryRChromaticity_x = stream.readUint16();
    this.primaryRChromaticity_y = stream.readUint16();
    this.primaryGChromaticity_x = stream.readUint16();
    this.primaryGChromaticity_y = stream.readUint16();
    this.primaryBChromaticity_x = stream.readUint16();
    this.primaryBChromaticity_y = stream.readUint16();
    this.whitePointChromaticity_x = stream.readUint16();
    this.whitePointChromaticity_y = stream.readUint16();
    this.luminanceMax = stream.readUint32();
    this.luminanceMin = stream.readUint32();
  }
}
