declare module BoxParser {
  interface cmexBox extends FullBox {
    pos_x?: number;
    pos_y?: number;
    pos_z?: number;
    quat_x?: number;
    quat_y?: number;
    quat_z?: number;
    id?: number;
  }
}
