declare module BoxParser {
  interface ccstBox extends FullBox {
    all_ref_pics_intra: boolean;
    intra_pred_used: boolean;
    max_ref_per_pic: number;
  }
}
