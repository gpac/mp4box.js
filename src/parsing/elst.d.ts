declare module BoxParser {
  interface elstBox extends FullBox {
    entries: {
      segment_duration: number;
      media_time: number;
      media_rate_integer: number;
      media_rate_fraction: number;
    }[];
  }
}
