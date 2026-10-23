import { Box, FullBox } from '#/box';
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
      stream.enterBitMode();
      for (let i = 0; i < this.num_channels; i++) {
        channels[i].channel_idc = stream.readBits(3);
        channels[i].reserved = stream.readBits(1);
        channels[i].component_format = stream.readBits(2);
        const subsampling_flag = stream.readFlag();
        const channel_label_flag = stream.readFlag();
        if (subsampling_flag) {
          channels[i].subsampling_type = stream.readBits(4);
          channels[i].subsampling_location = stream.readBits(4);
        }
        if (channel_label_flag) {
          channels[i].channel_label = stream.readCString();
        }
      }
      stream.exitBitMode();
    }
    for (let i = 0; i < this.num_channels; i++) {
      this.addEntry(channels[i]);
    }
  }
}
