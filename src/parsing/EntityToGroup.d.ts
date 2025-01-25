declare module BoxParser {
  interface EntityToGroupBox extends FullBox {
    group_id: number;
    num_entities_in_group: number;
    entity_ids: number[];
  }
}
