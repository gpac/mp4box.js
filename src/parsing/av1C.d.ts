declare module BoxParser {
  interface av1CBox extends Box {
    version: number;
    seq_profile: number;
    seq_level_idx_0: number;
    seq_tier_0: number;
    high_bitdepth: number;
    twelve_bit: number;
    monochrome: number;
    chroma_subsampling_x: number;
    chroma_subsampling_y: number;
    chroma_sample_position: number;
    reserved_1: number;
    initial_presentation_delay_present: number;
    initial_presentation_delay_minus_one?: number;
    reserved_2?: number;
    configOBUs: Uint8Array;
  }
}
