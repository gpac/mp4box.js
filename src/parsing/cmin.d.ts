declare module BoxParser {
  interface cminBox extends FullBox {
    focal_length_x: number;
    principal_point_x: number;
    principal_point_y: number;
    focal_length_y?: number;
    skew_factor?: number;
  }
}
