import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';

export interface Extent {
  extent_index: number;
  extent_offset: number;
  extent_length: number;
}

export class ilocBox extends FullBox {
  offset_size: number;
  length_size: number;
  base_offset_size: number;
  index_size: number;
  items: Array<{
    base_offset: number;
    construction_method: number;
    item_ID: number;
    data_reference_index: number;
    extents: Extent[];
  }>;

  constructor(size?: number) {
    super('iloc', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    let byte: number;
    byte = stream.readUint8();
    this.offset_size = (byte >> 4) & 0xf;
    this.length_size = byte & 0xf;
    byte = stream.readUint8();
    this.base_offset_size = (byte >> 4) & 0xf;
    if (this.version === 1 || this.version === 2) {
      this.index_size = byte & 0xf;
    } else {
      this.index_size = 0;
      // reserved = byte & 0xF;
    }
    this.items = [];
    let item_count = 0;
    if (this.version < 2) {
      item_count = stream.readUint16();
    } else if (this.version === 2) {
      item_count = stream.readUint32();
    } else {
      throw 'version of iloc box not supported';
    }
    for (let i = 0; i < item_count; i++) {
      let item_ID = 0;
      let construction_method = 0;
      let base_offset = 0;

      if (this.version < 2) {
        item_ID = stream.readUint16();
      } else if (this.version === 2) {
        item_ID = stream.readUint32();
      } else {
        throw 'version of iloc box not supported';
      }
      if (this.version === 1 || this.version === 2) {
        construction_method = stream.readUint16() & 0xf;
      } else {
        construction_method = 0;
      }

      const data_reference_index = stream.readUint16();
      switch (this.base_offset_size) {
        case 0:
          base_offset = 0;
          break;
        case 4:
          base_offset = stream.readUint32();
          break;
        case 8:
          base_offset = stream.readUint64();
          break;
        default:
          throw 'Error reading base offset size';
      }

      const extents: Array<Extent> = [];
      const extent_count = stream.readUint16();

      for (let j = 0; j < extent_count; j++) {
        let extent_index = 0;
        let extent_offset = 0;
        let extent_length = 0;

        if (this.version === 1 || this.version === 2) {
          switch (this.index_size) {
            case 0:
              extent_index = 0;
              break;
            case 4:
              extent_index = stream.readUint32();
              break;
            case 8:
              extent_index = stream.readUint64();
              break;
            default:
              throw 'Error reading extent index';
          }
        }

        switch (this.offset_size) {
          case 0:
            extent_offset = 0;
            break;
          case 4:
            extent_offset = stream.readUint32();
            break;
          case 8:
            extent_offset = stream.readUint64();
            break;
          default:
            throw 'Error reading extent index';
        }

        switch (this.length_size) {
          case 0:
            extent_length = 0;
            break;
          case 4:
            extent_length = stream.readUint32();
            break;
          case 8:
            extent_length = stream.readUint64();
            break;
          default:
            throw 'Error reading extent index';
        }

        extents.push({ extent_index, extent_length, extent_offset });
      }

      this.items.push({
        base_offset,
        construction_method,
        item_ID,
        data_reference_index,
        extents,
      });
    }
  }
}
