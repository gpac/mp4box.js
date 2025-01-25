declare module BoxParser {
  interface dec3Box extends Box {
    data_rate: number;
    num_ind_sub: number;
    ind_subs: {
      fscod: number;
      bsid: number;
      bsmod: number;
      acmod: number;
      lfeon: number;
      num_dep_sub: number;
      chan_loc?: number;
    }[];
  }
}
