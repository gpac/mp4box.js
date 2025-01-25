declare module BoxParser {
  interface avcCBox extends Box {
    configurationVersion: number;
    AVCProfileIndication: number;
    profile_compatibility: number;
    AVCLevelIndication: number;
    lengthSizeMinusOne: number;
    nb_SPS_nalus: number;
    SPS: { length: number; nalu: Uint8Array }[];
    nb_PPS_nalus: number;
    PPS: { length: number; nalu: Uint8Array }[];
    ext?: Uint8Array;
  }
}
