declare module BoxParser {
  interface auxCBox extends FullBox {
    aux_type: string;
    aux_subtype: Uint8Array;
  }
}
