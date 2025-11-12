import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import type { BitStream } from '#/bitstream';

export class cclvBox extends Box {
  static override readonly fourcc = 'cclv' as const;
  box_name = 'ContentColourVolumeBox' as const;

  ccv_primaries_x: Array<number>;
  ccv_primaries_y: Array<number>;
  ccv_min_luminance_value: number;
  ccv_max_luminance_value: number;
  ccv_avg_luminance_value: number;

  parse(stream: MultiBufferStream | BitStream) {
    const flags = stream.readUint8();
    const ccv_primaries_present_flag = flags & 0x10;
    const ccv_min_luminance_value_present_flag = flags & 0x08;
    const ccv_max_luminance_value_present_flag = flags & 0x04;
    const ccv_avg_luminance_value_present_flag = flags & 0x02;

    if (ccv_primaries_present_flag) {
      this.ccv_primaries_x = new Array<number>(3);
      this.ccv_primaries_y = new Array<number>(3);
      for (let c = 0; c < 3; c++) {
        this.ccv_primaries_x[c] = stream.readInt32();
        this.ccv_primaries_y[c] = stream.readInt32();
      }
    }
    if (ccv_min_luminance_value_present_flag) {
      this.ccv_min_luminance_value = stream.readUint32();
    }
    if (ccv_max_luminance_value_present_flag) {
      this.ccv_max_luminance_value = stream.readUint32();
    }
    if (ccv_avg_luminance_value_present_flag) {
      this.ccv_avg_luminance_value = stream.readUint32();
    }
  }
}
