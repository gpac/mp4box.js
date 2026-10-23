import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { amveBox } from './amve';
import { cclvBox } from './cclv';
import { clliBox } from './clli';
import { mdcvBox } from './mdcv';
import { ndwtBox } from './ndwt';
import { reveBox } from './reve';

export class miniBox extends Box {
  static override readonly fourcc = 'mini' as const;
  box_name = 'MinimizedImageBox' as const;

  version: number;

  explicit_codec_types_flag: boolean;
  float_flag: boolean;
  full_range_flag: boolean;
  alpha_flag: boolean;
  explicit_cicp_flag: boolean;
  hdr_flag: boolean;
  icc_flag: boolean;
  exif_flag: boolean;
  xmp_flag: boolean;

  chroma_subsampling: number;
  orientation_minus1: number;

  large_dimensions_flag: boolean;
  width_minus1: number;
  height_minus1: number;

  chroma_is_horizontally_centered: boolean;
  chroma_is_vertically_centered: boolean;

  bit_depth: number;

  alpha_is_premultiplied: boolean;

  colour_primaries: number;
  transfer_characteristics: number;
  matrix_coefficients: number;

  infe_type: string;
  codec_config_type: string;

  gainmap_flag: boolean;
  gainmap_width_minus1: number;
  gainmap_height_minus1: number;
  gainmap_matrix_coefficients: number;
  gainmap_full_range_flag: boolean;
  gainmap_chroma_subsampling: number;
  gainmap_chroma_is_horizontally_centered: boolean;
  gainmap_chroma_is_vertically_centered: boolean;
  gainmap_float_flag: boolean;
  gainmap_bit_depth: number;
  tmap_icc_flag: boolean;
  tmap_explicit_cicp_flag: boolean;
  tmap_colour_primaries: number;
  tmap_transfer_characteristics: number;
  tmap_matrix_coefficients: number;
  tmap_full_range_flag: boolean;

  large_metadata_flag: boolean;
  large_codec_config_flag: boolean;
  large_item_data_flag: boolean;

  icc_data_size_minus1: number;
  tmap_icc_data_size_minus1: number;
  gainmap_metadata_size: number;
  gainmap_item_data_size: number;
  gainmap_item_codec_config_size: number;
  main_item_codec_config_size: number;
  main_item_data_size_minus1: number;
  alpha_item_data_size: number;
  alpha_item_codec_config_size: number;
  exif_xmp_compressed_flag: boolean;
  exif_data_size_minus1: number;
  xmp_data_size_minus1: number;

  parse(stream: MultiBufferStream) {
    stream.enterBitMode();
    this.version = stream.readBits(2);

    this.explicit_codec_types_flag = stream.readFlag();
    this.float_flag = stream.readFlag();
    this.full_range_flag = stream.readFlag();
    this.alpha_flag = stream.readFlag();
    this.explicit_cicp_flag = stream.readFlag();
    this.hdr_flag = stream.readFlag();
    this.icc_flag = stream.readFlag();
    this.exif_flag = stream.readFlag();
    this.xmp_flag = stream.readFlag();

    this.chroma_subsampling = stream.readBits(2);
    this.orientation_minus1 = stream.readBits(3);

    this.large_dimensions_flag = stream.readFlag();
    this.width_minus1 = stream.readBits(this.large_dimensions_flag ? 15 : 7);
    this.height_minus1 = stream.readBits(this.large_dimensions_flag ? 15 : 7);

    // Pixel information
    if (this.chroma_subsampling === 1 || this.chroma_subsampling === 2) {
      this.chroma_is_horizontally_centered = stream.readFlag();
    }
    if (this.chroma_subsampling === 1) {
      this.chroma_is_vertically_centered = stream.readFlag();
    }
    if (this.float_flag) {
      this.bit_depth = 1 << (stream.readBits(2) + 4);
    } else {
      this.bit_depth = stream.readFlag() ? stream.readBits(3) + 9 : 8;
    }
    if (this.alpha_flag) {
      this.alpha_is_premultiplied = stream.readFlag();
    }
    // Colour properties
    if (this.explicit_cicp_flag) {
      this.colour_primaries = stream.readBits(8);
      this.transfer_characteristics = stream.readBits(8);
      this.matrix_coefficients = stream.readBits(8);
    } else {
      this.colour_primaries = this.icc_flag ? 2 : 1;
      this.transfer_characteristics = this.icc_flag ? 2 : 13;
      this.matrix_coefficients = this.chroma_subsampling === 0 ? 2 : 6;
    }
    if (this.explicit_codec_types_flag) {
      this.infe_type = stream.readString(4);
      this.codec_config_type = stream.readString(4);
    } else {
      this.infe_type = '[deduced from ftyp minor_version]';
      this.codec_config_type = '[deduced from ftyp minor_version]';
    }

    // High Dynamic Range properties
    if (this.hdr_flag) {
      this.gainmap_flag = stream.readFlag();
      if (this.gainmap_flag) {
        const gainmap_dimension_same_as_main_item_flag = stream.readFlag();
        if (gainmap_dimension_same_as_main_item_flag) {
          this.gainmap_width_minus1 = this.width_minus1;
          this.gainmap_height_minus1 = this.height_minus1;
        } else {
          this.gainmap_width_minus1 = stream.readBits(this.large_dimensions_flag ? 15 : 7);
          this.gainmap_height_minus1 = stream.readBits(this.large_dimensions_flag ? 15 : 7);
        }
        this.gainmap_matrix_coefficients = stream.readBits(8);
        this.gainmap_full_range_flag = stream.readFlag();
        this.gainmap_chroma_subsampling = stream.readBits(2);
        if (this.gainmap_chroma_subsampling === 1 || this.gainmap_chroma_subsampling === 2) {
          this.gainmap_chroma_is_horizontally_centered = stream.readFlag();
        }
        if (this.gainmap_chroma_subsampling === 1) {
          this.gainmap_chroma_is_vertically_centered = stream.readFlag();
        }
        this.gainmap_float_flag = stream.readFlag();

        if (this.gainmap_float_flag) {
          this.gainmap_bit_depth = 1 << (stream.readBits(2) + 4);
        } else {
          this.gainmap_bit_depth = stream.readFlag() ? stream.readBits(3) + 9 : 8;
        }
        this.tmap_icc_flag = stream.readFlag();
        this.tmap_explicit_cicp_flag = stream.readFlag();
        if (this.tmap_explicit_cicp_flag) {
          this.tmap_colour_primaries = stream.readBits(8);
          this.tmap_transfer_characteristics = stream.readBits(8);
          this.tmap_matrix_coefficients = stream.readBits(8);
          this.tmap_full_range_flag = stream.readFlag();
        } else {
          this.tmap_colour_primaries = 1;
          this.tmap_transfer_characteristics = 13;
          this.tmap_matrix_coefficients = 6;
          this.tmap_full_range_flag = true;
        }
      }

      // These are only the inner syntaxes, not the boxes themselves.
      // Still create child boxes for prettier display.
      const parse_hdr_boxes = (parent: Box) => {
        const clli_flag = stream.readFlag();
        const mdcv_flag = stream.readFlag();
        const cclv_flag = stream.readFlag();
        const amve_flag = stream.readFlag();
        const reve_flag = stream.readFlag();
        const ndwt_flag = stream.readFlag();
        if (clli_flag) {
          const clli = new clliBox();
          clli.parse(stream);
          parent.addBox(clli);
        }
        if (mdcv_flag) {
          const mdcv = new mdcvBox();
          mdcv.parse(stream);
          parent.addBox(mdcv);
        }
        if (cclv_flag) {
          const cclv = new cclvBox();
          cclv.parse(stream);
          parent.addBox(cclv);
        }
        if (amve_flag) {
          const amve = new amveBox();
          amve.parse(stream);
          parent.addBox(amve);
        }
        if (reve_flag) {
          const reve = new reveBox();
          reve.parse(stream);
          parent.addBox(reve);
        }
        if (ndwt_flag) {
          const ndwt = new ndwtBox();
          ndwt.parse(stream);
          parent.addBox(ndwt);
        }
      };
      parse_hdr_boxes(this);

      if (this.gainmap_flag) {
        const tmap_placeholder = new Box();
        tmap_placeholder.box_name = 'tmap';
        parse_hdr_boxes(tmap_placeholder);
        if (tmap_placeholder.boxes) {
          this.addBox(tmap_placeholder);
        }
      }
    }

    // Chunk sizes
    if (this.icc_flag || this.exif_flag || this.xmp_flag || (this.hdr_flag && this.gainmap_flag)) {
      this.large_metadata_flag = stream.readFlag();
    }
    this.large_codec_config_flag = stream.readFlag();
    this.large_item_data_flag = stream.readFlag();
    if (this.icc_flag) {
      this.icc_data_size_minus1 = stream.readBits(this.large_metadata_flag ? 20 : 10);
    }
    if (this.hdr_flag && this.gainmap_flag && this.tmap_icc_flag) {
      this.tmap_icc_data_size_minus1 = stream.readBits(this.large_metadata_flag ? 20 : 10);
    }
    if (this.hdr_flag && this.gainmap_flag) {
      this.gainmap_metadata_size = stream.readBits(this.large_metadata_flag ? 20 : 10);
    }
    if (this.hdr_flag && this.gainmap_flag) {
      this.gainmap_item_data_size = stream.readBits(this.large_item_data_flag ? 28 : 15);
    }
    if (this.hdr_flag && this.gainmap_flag && this.gainmap_item_data_size > 0) {
      this.gainmap_item_codec_config_size = stream.readBits(this.large_codec_config_flag ? 12 : 3);
    }
    this.main_item_codec_config_size = stream.readBits(this.large_codec_config_flag ? 12 : 3);
    this.main_item_data_size_minus1 = stream.readBits(this.large_item_data_flag ? 28 : 15);
    if (this.alpha_flag) {
      this.alpha_item_data_size = stream.readBits(this.large_item_data_flag ? 28 : 15);
    }
    if (this.alpha_flag && this.alpha_item_data_size > 0) {
      this.alpha_item_codec_config_size = stream.readBits(this.large_codec_config_flag ? 12 : 3);
    }
    if (this.exif_flag || this.xmp_flag) {
      this.exif_xmp_compressed_flag = stream.readFlag();
    }
    if (this.exif_flag) {
      this.exif_data_size_minus1 = stream.readBits(this.large_metadata_flag ? 20 : 10);
    }
    if (this.xmp_flag) {
      this.xmp_data_size_minus1 = stream.readBits(this.large_metadata_flag ? 20 : 10);
    }
    stream.exitBitMode(); // bit padding till byte alignment

    // The following chunks are raw bytes. No need to parse them as explicit fields.

    // unsigned int(8) main_item_codec_config[main_item_codec_config_size];
    // unsigned int(8) alpha_item_codec_config[]; // non-parsed variable
    // if (alpha_flag && alpha_item_data_size > 0) {
    //   if(alpha_item_codec_config_size == 0) {
    //     alpha_item_codec_config_size = main_item_codec_config_size;
    //     alpha_item_codec_config = main_item_codec_config;
    //   } else {
    //     unsigned int(8) alpha_item_explicit_codec_config[alpha_item_codec_config_size];
    //     alpha_item_codec_config = alpha_item_explicit_codec_config;
    //   }
    // }
    // unsigned int(8) gainmap_item_codec_config[]; // non-parsed variable
    // if (hdr_flag && gainmap_flag && gainmap_item_data_size > 0) {
    //   if (gainmap_item_codec_config_size == 0) {
    //     gainmap_item_codec_config_size = main_item_codec_config_size;
    //     gainmap_item_codec_config = main_item_codec_config;
    //   } else {
    //     unsigned int(8) gainmap_item_explicit_codec_config[gainmap_item_codec_config_size];
    //     gainmap_item_codec_config = gainmap_item_explicit_codec_config;
    //   }
    // }
    // if (icc_flag)
    //   unsigned int(8) icc_data[icc_data_size_minus1 + 1];
    // if (hdr_flag && gainmap_flag && tmap_icc_flag)
    //   unsigned int(8) tmap_icc_data[tmap_icc_data_size_minus1 + 1];
    // if (hdr_flag && gainmap_flag && gainmap_metadata_size > 0)
    //   unsigned int(8) gainmap_metadata[gainmap_metadata_size];
    // if (alpha_flag && alpha_item_data_size > 0)
    //   unsigned int(8) alpha_item_data[alpha_item_data_size];
    // if (hdr_flag && gainmap_flag && gainmap_item_data_size > 0)
    //   unsigned int(8) gainmap_item_data[gainmap_item_data_size];
    // unsigned int(8) main_item_data[main_item_data_size_minus1 + 1];
    // if (exif_flag)
    //   unsigned int(8) exif_data[exif_data_size_minus1 + 1];
    // if (xmp_flag)
    //   unsigned int(8) xmp_data[xmp_data_size_minus1 + 1];
  }
}
