import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class cmpdBox extends Box {
  component_count?: number;
  component_types?: number[];
  component_type_urls?: string[];

  constructor(size?: number) {
    super('cmpd', size);
  }

  parse(stream: MultiBufferStream) {
    this.component_count = stream.readUint32();
    this.component_types = [];
    this.component_type_urls = [];
    for (let i = 0; i < this.component_count; i++) {
      var component_type = stream.readUint16();
      this.component_types.push(component_type);
      if (component_type >= 0x8000) {
        this.component_type_urls.push(stream.readCString());
      }
    }
  }
}
