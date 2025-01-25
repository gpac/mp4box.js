declare module BoxParser {
  interface emsgBox extends FullBox {
    timescale: number;
    presentation_time: number;
    event_duration: number;
    id: number;
    scheme_id_uri: string;
    value: string;
    presentation_time_delta?: number;
    message_data: Uint8Array;
  }
}
