import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class cclvBox extends Box {
  static override readonly fourcc = 'cclv' as const;
  box_name = 'ContentColourVolumeBox' as const;

  ccv_primaries_x: Array<number>;
  ccv_primaries_y: Array<number>;
  ccv_min_luminance_value: number;
  ccv_max_luminance_value: number;
  ccv_avg_luminance_value: number;

  parse(stream: MultiBufferStream) {
    stream.enterBitMode();
    stream.skipBits(1); // reserved (ccv_cancel_flag)
    stream.skipBits(1); // reserved (ccv_persistence_flag)
    const ccv_primaries_present_flag = stream.readFlag();
    const ccv_min_luminance_value_present_flag = stream.readFlag();
    const ccv_max_luminance_value_present_flag = stream.readFlag();
    const ccv_avg_luminance_value_present_flag = stream.readFlag();
    stream.skipBits(2); // reserved
    stream.exitBitMode();

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
