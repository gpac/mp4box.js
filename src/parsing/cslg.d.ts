declare module BoxParser {
  interface cslgBox extends FullBox {
    compositionToDTSShift: number;
    leastDecodeToDisplayDelta: number;
    greatestDecodeToDisplayDelta: number;
    compositionStartTime: number;
    compositionEndTime: number;
  }
}
