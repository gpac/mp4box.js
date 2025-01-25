declare module BoxParser {
  interface btrtBox extends Box {
    bufferSizeDB: number;
    maxBitrate: number;
    avgBitrate: number;
  }
}
