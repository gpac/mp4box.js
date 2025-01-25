declare module BoxParser {
  interface dOpsBox extends Box {
    Version: number;
    OutputChannelCount: number;
    PreSkip: number;
    InputSampleRate: number;
    OutputGain: number;
    ChannelMappingFamily: number;
    StreamCount?: number;
    CoupledCount?: number;
    ChannelMapping?: number[];
  }
}
