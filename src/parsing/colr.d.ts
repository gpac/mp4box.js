declare module BoxParser {
  interface colrBox extends Box {
    colour_type: string;
    colour_primaries?: number;
    transfer_characteristics?: number;
    matrix_coefficients?: number;
    full_range_flag?: number;
    ICC_profile?: Uint8Array;
  }
}
