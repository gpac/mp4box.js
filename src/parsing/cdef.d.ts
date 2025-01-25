declare module BoxParser {
  interface cdefBox extends Box {
    channel_count: number;
    channel_indexes: number[];
    channel_types: number[];
    channel_associations: number[];
  }
}
