import { Box, FullBox } from '#/box';
import { BitStream } from '#/bitstream';
import type { MultiBufferStream } from '#/buffer';

class pixiBoxChannel extends Box {
  depth: number;
  channel_idc: number;
  reserved: number;
  component_format: number;
  subsampling_type: number;
  subsampling_location: number;
  channel_label: string;
}

export class pixiBox extends FullBox {
  static override readonly fourcc = 'pixi' as const;
  box_name = 'PixelInformationProperty' as const;

  num_channels: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.num_channels = stream.readUint8();
    const channels = [];
    for (let i = 0; i < this.num_channels; i++) {
      channels[i] = new pixiBoxChannel();
      channels[i].depth = stream.readUint8();
    }
    if (this.flags & 0x1) {
      const bits = new BitStream(stream);
      for (let i = 0; i < this.num_channels; i++) {
        channels[i].channel_idc = bits.read(3);
        channels[i].reserved = bits.read(1);
        channels[i].component_format = bits.read(2);
        const subsampling_flag = bits.bool();
        const channel_label_flag = bits.bool();
        if (subsampling_flag) {
          channels[i].subsampling_type = bits.read(4);
          channels[i].subsampling_location = bits.read(4);
        }
        if (channel_label_flag) {
          channels[i].channel_label = stream.readCString();
        }
      }
    }
    for (let i = 0; i < this.num_channels; i++) {
      this.addEntry(channels[i]);
    }
  }
}
