import type { MultiBufferStream } from '#/buffer';
import { EntityToGroup } from './base';

// Auto exposure bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.2.1)
export class aebrBox extends EntityToGroup {
  type = 'aebr' as const;
  box_name = 'Auto exposure bracketing';
}

// Flash exposure bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.5.1)
export class afbrBox extends EntityToGroup {
  type = 'afbr' as const;
  box_name = 'Flash exposure information';
}

// Album collection (ISO/IEC 23008-12:2022 Section 6.8.7.1)
export class albcBox extends EntityToGroup {
  type = 'albc' as const;
  box_name = 'Album collection';
}

// Alternative entity (ISO/IEC 14496-12:2022 Section 8.18.3.1)
export class altrBox extends EntityToGroup {
  type = 'altr' as const;
  box_name = 'Alternative entity';
}

// Burst image entity group (ISO/IEC 23008-12:2022 Section 6.8.2.2)
export class brstBox extends EntityToGroup {
  type = 'brst' as const;
  box_name = 'Burst image';
}

// Depth of field bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.6.1)
export class dobrBox extends EntityToGroup {
  type = 'dobr' as const;
  box_name = 'Depth of field bracketing';
}

// Equivalent entity (ISO/IEC 23008-12:2022 Section 6.8.1.1)
export class eqivBox extends EntityToGroup {
  type = 'eqiv' as const;
  box_name = 'Equivalent entity';
}

// Favourites collection (ISO/IEC 23008-12:2022 Section 6.8.7.2)
export class favcBox extends EntityToGroup {
  type = 'favc' as const;
  box_name = 'Favorites collection';
}

// Focus bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.4.1)
export class fobrBox extends EntityToGroup {
  type = 'fobr' as const;
  box_name = 'Focus bracketing';
}

// Audio to image entity group (ISO/IEC 23008-12:2022 Section 6.8.4)
export class iaugBox extends EntityToGroup {
  type = 'iaug' as const;
  box_name = 'Image item with an audio track';
}

// Panorama (ISO/IEC 23008-12:2022 Section 6.8.8.1)
export class panoBox extends EntityToGroup {
  type = 'pano' as const;
  box_name = 'Panorama';
}

// Slideshow (ISO/IEC 23008-12:2022 Section 6.8.9.1)
export class slidBox extends EntityToGroup {
  type = 'slid' as const;
  box_name = 'Slideshow';
}

// Stereo pair (ISO/IEC 23008-12:2022 Section 6.8.5)
export class sterBox extends EntityToGroup {
  type = 'ster' as const;
  box_name = 'Stereo';
}

// Time-synchronised capture entity group (ISO/IEC 23008-12:2022 Section 6.8.3)
export class tsynBox extends EntityToGroup {
  type = 'tsyn' as const;
  box_name = 'Time-synchronized capture';
}

// White balance bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.3.1)
export class wbbrBox extends EntityToGroup {
  type = 'wbbr' as const;
  box_name = 'White balance bracketing';
}

// Alternative entity (ISO/IEC 23008-12:2022 AMD1 Section 6.8.10)
export class prgrBox extends EntityToGroup {
  type = 'prgr' as const;
  box_name = 'Progressive rendering';
}

// Image Pyramid entity group (ISO/IEC 23008-12:20xx Section 6.8.11)
export class pymdBox extends EntityToGroup {
  tile_size_x: number;
  tile_size_y: number;
  layer_binning: Array<number>;
  tiles_in_layer_column_minus1: Array<number>;
  tiles_in_layer_row_minus1: Array<number>;

  type = 'pymd' as const;
  box_name = 'Image pyramid';

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
