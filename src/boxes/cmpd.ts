import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class cmpdBox extends Box {
  type = 'cmpd' as const;

  component_count: number;
  component_types: Array<number>;
  component_type_urls: Array<string>;

  parse(stream: MultiBufferStream) {
    this.component_count = stream.readUint32();
    this.component_types = [];
    this.component_type_urls = [];
    for (let i = 0; i < this.component_count; i++) {
      const component_type = stream.readUint16();
      this.component_types.push(component_type);
      if (component_type >= 0x8000) {
        this.component_type_urls.push(stream.readCString());
      }
    }
  }
}
