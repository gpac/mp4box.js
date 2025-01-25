declare module BoxParser {
  interface dac3Box extends Box {
    fscod: number;
    bsid: number;
    bsmod: number;
    acmod: number;
    lfeon: number;
    bit_rate_code: number;
  }
}
