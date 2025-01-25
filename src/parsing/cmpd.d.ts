declare module BoxParser {
  interface cmpdBox extends Box {
    component_count: number;
    component_types: number[];
    component_type_urls: string[];
  }
}
