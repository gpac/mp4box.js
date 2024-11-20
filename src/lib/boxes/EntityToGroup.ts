import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';

// ISO/IEC 14496-12:2022 Section 8.18.3 Entity to group box
export class EntityToGroup extends FullBox {
  group_id?: number;
  num_entities_in_group?: number;
  entity_ids?: number[];

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.group_id = stream.readUint32();
    this.num_entities_in_group = stream.readUint32();
    this.entity_ids = [];
    for (let i = 0; i < this.num_entities_in_group; i++) {
      const entity_id = stream.readUint32();
      this.entity_ids.push(entity_id);
    }
  }
}

// Auto exposure bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.2.1)
export class aebrBox extends EntityToGroup {
  constructor(size?: number) {
    super('aebr', size);
  }
}

// Flash exposure bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.5.1)
export class afbrBox extends EntityToGroup {
  constructor(size?: number) {
    super('afbr', size);
  }
}

// Album collection (ISO/IEC 23008-12:2022 Section 6.8.7.1)
export class albcBox extends EntityToGroup {
  constructor(size?: number) {
    super('albc', size);
  }
}

// Alternative entity (ISO/IEC 14496-12:2022 Section 8.18.3.1)
export class altrBox extends EntityToGroup {
  constructor(size?: number) {
    super('altr', size);
  }
}

// Burst image entity group (ISO/IEC 23008-12:2022 Section 6.8.2.2)
export class brstBox extends EntityToGroup {
  constructor(size?: number) {
    super('brst', size);
  }
}

// Depth of field bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.6.1)
export class dobrBox extends EntityToGroup {
  constructor(size?: number) {
    super('dobr', size);
  }
}

// Equivalent entity (ISO/IEC 23008-12:2022 Section 6.8.1.1)
export class eqivBox extends EntityToGroup {
  constructor(size?: number) {
    super('eqiv', size);
  }
}

// Favourites collection (ISO/IEC 23008-12:2022 Section 6.8.7.2)
export class favcBox extends EntityToGroup {
  constructor(size?: number) {
    super('favc', size);
  }
}

// Focus bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.4.1)
export class fobrBox extends EntityToGroup {
  constructor(size?: number) {
    super('fobr', size);
  }
}

// Audio to image entity group (ISO/IEC 23008-12:2022 Section 6.8.4)
export class iaugBox extends EntityToGroup {
  constructor(size?: number) {
    super('iaug', size);
  }
}

// Panorama (ISO/IEC 23008-12:2022 Section 6.8.8.1)
export class panoBox extends EntityToGroup {
  constructor(size?: number) {
    super('pano', size);
  }
}

// Slideshow (ISO/IEC 23008-12:2022 Section 6.8.9.1)
export class slidBox extends EntityToGroup {
  constructor(size?: number) {
    super('slid', size);
  }
}

// Stereo pair (ISO/IEC 23008-12:2022 Section 6.8.5)
export class sterBox extends EntityToGroup {
  constructor(size?: number) {
    super('ster', size);
  }
}

// Time-synchronised capture entity group (ISO/IEC 23008-12:2022 Section 6.8.3)
export class tsynBox extends EntityToGroup {
  constructor(size?: number) {
    super('tsyn', size);
  }
}

// White balance bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.3.1)
export class wbbrBox extends EntityToGroup {
  constructor(size?: number) {
    super('wbbr', size);
  }
}

// Alternative entity (ISO/IEC 23008-12:2022 AMD1 Section 6.8.10)
export class prgrBox extends EntityToGroup {
  constructor(size?: number) {
    super('prgr', size);
  }
}

// Image Pyramid entity group (ISO/IEC 23008-12:20xx Section 6.8.11)
export class pymdBox extends EntityToGroup {
  tile_size_x?: number;
  tile_size_y?: number;
  layer_binning?: number[];
  tiles_in_layer_column_minus1?: number[];
  tiles_in_layer_row_minus1?: number[];

  constructor(size?: number) {
    super('pymd', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.group_id = stream.readUint32();
    this.num_entities_in_group = stream.readUint32();
    this.entity_ids = [];
    for (let i = 0; i < this.num_entities_in_group; i++) {
      const entity_id = stream.readUint32();
      this.entity_ids.push(entity_id);
    }

    this.tile_size_x = stream.readUint16();
    this.tile_size_y = stream.readUint16();
    this.layer_binning = [];
    this.tiles_in_layer_column_minus1 = [];
    this.tiles_in_layer_row_minus1 = [];
    for (let i = 0; i < this.num_entities_in_group; i++) {
      this.layer_binning[i] = stream.readUint16();
      this.tiles_in_layer_row_minus1[i] = stream.readUint16();
      this.tiles_in_layer_column_minus1[i] = stream.readUint16();
    }
  }
}
