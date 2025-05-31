import type { MultiBufferStream } from '#/buffer';
import { EntityToGroup } from './base';

// Auto exposure bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.2.1)
export class aebrBox extends EntityToGroup {
  static override fourcc = 'aebr' as const;
  box_name = 'Auto exposure bracketing' as const;
}

// Flash exposure bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.5.1)
export class afbrBox extends EntityToGroup {
  static override fourcc = 'afbr' as const;
  box_name = 'Flash exposure information' as const;
}

// Album collection (ISO/IEC 23008-12:2022 Section 6.8.7.1)
export class albcBox extends EntityToGroup {
  static override fourcc = 'albc' as const;
  box_name = 'Album collection' as const;
}

// Alternative entity (ISO/IEC 14496-12:2022 Section 8.18.3.1)
export class altrBox extends EntityToGroup {
  static override fourcc = 'altr' as const;
  box_name = 'Alternative entity' as const;
}

// Burst image entity group (ISO/IEC 23008-12:2022 Section 6.8.2.2)
export class brstBox extends EntityToGroup {
  static override fourcc = 'brst' as const;
  box_name = 'Burst image' as const;
}

// Depth of field bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.6.1)
export class dobrBox extends EntityToGroup {
  static override fourcc = 'dobr' as const;
  box_name = 'Depth of field bracketing' as const;
}

// Equivalent entity (ISO/IEC 23008-12:2022 Section 6.8.1.1)
export class eqivBox extends EntityToGroup {
  static override fourcc = 'eqiv' as const;
  box_name = 'Equivalent entity' as const;
}

// Favourites collection (ISO/IEC 23008-12:2022 Section 6.8.7.2)
export class favcBox extends EntityToGroup {
  static override fourcc = 'favc' as const;
  box_name = 'Favorites collection' as const;
}

// Focus bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.4.1)
export class fobrBox extends EntityToGroup {
  static override fourcc = 'fobr' as const;
  box_name = 'Focus bracketing' as const;
}

// Audio to image entity group (ISO/IEC 23008-12:2022 Section 6.8.4)
export class iaugBox extends EntityToGroup {
  static override fourcc = 'iaug' as const;
  box_name = 'Image item with an audio track' as const;
}

// Panorama (ISO/IEC 23008-12:2022 Section 6.8.8.1)
export class panoBox extends EntityToGroup {
  static override fourcc = 'pano' as const;
  box_name = 'Panorama' as const;
}

// Slideshow (ISO/IEC 23008-12:2022 Section 6.8.9.1)
export class slidBox extends EntityToGroup {
  static override fourcc = 'slid' as const;
  box_name = 'Slideshow' as const;
}

// Stereo pair (ISO/IEC 23008-12:2022 Section 6.8.5)
export class sterBox extends EntityToGroup {
  static override fourcc = 'ster' as const;
  box_name = 'Stereo' as const;
}

// Time-synchronised capture entity group (ISO/IEC 23008-12:2022 Section 6.8.3)
export class tsynBox extends EntityToGroup {
  static override fourcc = 'tsyn' as const;
  box_name = 'Time-synchronized capture' as const;
}

// White balance bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.3.1)
export class wbbrBox extends EntityToGroup {
  static override fourcc = 'wbbr' as const;
  box_name = 'White balance bracketing' as const;
}

// Alternative entity (ISO/IEC 23008-12:2022 AMD1 Section 6.8.10)
export class prgrBox extends EntityToGroup {
  static override fourcc = 'prgr' as const;
  box_name = 'Progressive rendering' as const;
}

// Image Pyramid entity group (ISO/IEC 23008-12:20xx Section 6.8.11)
export class pymdBox extends EntityToGroup {
  tile_size_x: number;
  tile_size_y: number;
  layer_binning: Array<number>;
  tiles_in_layer_column_minus1: Array<number>;
  tiles_in_layer_row_minus1: Array<number>;

  static override fourcc = 'pymd' as const;
  box_name = 'Image pyramid' as const;

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
