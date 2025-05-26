import type { av1CBox } from '#/boxes/av1C';
import type { avcCBox } from '#/boxes/avcC';
import type { sinfBox } from '#/boxes/defaults';
import type { esdsBox } from '#/boxes/esds';
import type { hvcCBox } from '#/boxes/hvcC';
import type { vpcCBox } from '#/boxes/vpcC';
import type { vvcCBox } from '#/boxes/vvcC';
import {
  AudioSampleEntry,
  MetadataSampleEntry,
  SubtitleSampleEntry,
  SystemSampleEntry,
  TextSampleEntry,
  VisualSampleEntry,
} from './base';

/** @bundle box-codecs.js */
function decimalToHex(d: number | string, padding?: number | null) {
  let hex = Number(d).toString(16);
  padding = typeof padding === 'undefined' || padding === null ? (padding = 2) : padding;
  while (hex.length < padding) {
    hex = '0' + hex;
  }
  return hex;
}

class avcCSampleEntryBase extends VisualSampleEntry {
  declare avcC: avcCBox;
  declare avcCs: Array<avcCBox>;

  /** @bundle box-codecs.js */
  getCodec() {
    const baseCodec = super.getCodec();
    if (this.avcC) {
      return `${baseCodec}.${decimalToHex(this.avcC.AVCProfileIndication)}${decimalToHex(
        this.avcC.profile_compatibility,
      )}${decimalToHex(this.avcC.AVCLevelIndication)}`;
    } else {
      return baseCodec;
    }
  }
}

// Sample entries inheriting from Audio and Video
export class avc1SampleEntry extends avcCSampleEntryBase {
  type = 'avc1' as const;
}

export class avc2SampleEntry extends avcCSampleEntryBase {
  type = 'avc2' as const;
}

export class avc3SampleEntry extends avcCSampleEntryBase {
  type = 'avc3' as const;
}

export class avc4SampleEntry extends avcCSampleEntryBase {
  type = 'avc4' as const;
}

export class av01SampleEntry extends VisualSampleEntry {
  av1C: av1CBox;
  av1Cs: Array<av1CBox>;

  type = 'av01' as const;

  /** @bundle box-codecs.js */
  getCodec(): string {
    // NOTE:    was before `const baseCodec = SampleEntry.prototype.getCodec.call(this);`
    const baseCodec = super.getCodec();

    const level_idx_0 = this.av1C.seq_level_idx_0;
    const level = level_idx_0 < 10 ? '0' + level_idx_0 : level_idx_0;
    let bitdepth: string;
    if (this.av1C.seq_profile === 2 && this.av1C.high_bitdepth === 1) {
      bitdepth = this.av1C.twelve_bit === 1 ? '12' : '10';
    } else if (this.av1C.seq_profile <= 2) {
      bitdepth = this.av1C.high_bitdepth === 1 ? '10' : '08';
    }
    // TODO need to parse the SH to find color config
    return (
      baseCodec +
      '.' +
      this.av1C.seq_profile +
      '.' +
      level +
      (this.av1C.seq_tier_0 ? 'H' : 'M') +
      '.' +
      bitdepth
    ); //+"."+this.av1C.monochrome+"."+this.av1C.chroma_subsampling_x+""+this.av1C.chroma_subsampling_y+""+this.av1C.chroma_sample_position;
  }
}

export class dav1SampleEntry extends VisualSampleEntry {
  type = 'dav1' as const;
}

class hvcCSampleEntryBase extends VisualSampleEntry {
  declare hvcC: hvcCBox;
  declare hvcCs: Array<hvcCBox>;

  /** @bundle box-codecs.js */
  getCodec(): string {
    let baseCodec = super.getCodec();
    if (this.hvcC) {
      baseCodec += '.';
      switch (this.hvcC.general_profile_space) {
        case 0:
          break;
        case 1:
          baseCodec += 'A';
          break;
        case 2:
          baseCodec += 'B';
          break;
        case 3:
          baseCodec += 'C';
          break;
      }
      baseCodec += this.hvcC.general_profile_idc;
      baseCodec += '.';
      let val = this.hvcC.general_profile_compatibility;
      let reversed = 0;
      for (let i = 0; i < 32; i++) {
        reversed |= val & 1;
        if (i === 31) {
          break;
        }
        reversed <<= 1;
        val >>= 1;
      }
      baseCodec += decimalToHex(reversed, 0);
      baseCodec += '.';
      if (this.hvcC.general_tier_flag === 0) {
        baseCodec += 'L';
      } else {
        baseCodec += 'H';
      }
      baseCodec += this.hvcC.general_level_idc;
      let hasByte = false;
      let constraint_string = '';
      for (let i = 5; i >= 0; i--) {
        if (this.hvcC.general_constraint_indicator[i] || hasByte) {
          constraint_string =
            '.' + decimalToHex(this.hvcC.general_constraint_indicator[i], 0) + constraint_string;
          hasByte = true;
        }
      }
      baseCodec += constraint_string;
    }
    return baseCodec;
  }
}

export class hvc1SampleEntry extends hvcCSampleEntryBase {
  type = 'hvc1' as const;
}

export class hev1SampleEntry extends hvcCSampleEntryBase {
  type = 'hev1' as const;
}

export class hvt1SampleEntry extends VisualSampleEntry {
  type = 'hvt1' as const;
}

export class lhe1SampleEntry extends VisualSampleEntry {
  type = 'lhe1' as const;
}

export class dvh1SampleEntry extends VisualSampleEntry {
  type = 'dvh1' as const;
}

export class dvheSampleEntry extends VisualSampleEntry {
  type = 'dvhe' as const;
}

/** @babel box-codecs.js */
class vvcCSampleEntryBase extends VisualSampleEntry {
  vvcC: vvcCBox;
  vvcCs: Array<vvcCBox>;
  getCodec() {
    let baseCodec = super.getCodec();
    if (this.vvcC) {
      baseCodec += '.' + this.vvcC.general_profile_idc;
      if (this.vvcC.general_tier_flag) {
        baseCodec += '.H';
      } else {
        baseCodec += '.L';
      }
      baseCodec += this.vvcC.general_level_idc;

      let constraint_string = '';
      if (this.vvcC.general_constraint_info) {
        const bytes = [];
        let byte = 0;
        byte |= this.vvcC.ptl_frame_only_constraint_flag << 7;
        byte |= this.vvcC.ptl_multilayer_enabled_flag << 6;
        let last_nonzero: number | undefined = undefined;
        for (let i = 0; i < this.vvcC.general_constraint_info.length; ++i) {
          byte |= (this.vvcC.general_constraint_info[i] >> 2) & 0x3f;
          bytes.push(byte);
          if (byte) {
            last_nonzero = i;
          }

          byte = (this.vvcC.general_constraint_info[i] >> 2) & 0x03;
        }

        if (last_nonzero === undefined) {
          constraint_string = '.CA';
        } else {
          constraint_string = '.C';
          const base32_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
          let held_bits = 0;
          let num_held_bits = 0;
          for (let i = 0; i <= last_nonzero; ++i) {
            held_bits = (held_bits << 8) | bytes[i];
            num_held_bits += 8;

            while (num_held_bits >= 5) {
              const val = (held_bits >> (num_held_bits - 5)) & 0x1f;
              constraint_string += base32_chars[val];

              num_held_bits -= 5;
              held_bits &= (1 << num_held_bits) - 1;
            }
          }
          if (num_held_bits) {
            held_bits <<= 5 - num_held_bits; // right-pad with zeros to 5 bits (is this correct?)
            constraint_string += base32_chars[held_bits & 0x1f];
          }
        }
      }
      baseCodec += constraint_string;
    }
    return baseCodec;
  }
}

export class vvc1SampleEntry extends vvcCSampleEntryBase {
  type = 'vvc1' as const;
}

export class vvi1SampleEntry extends vvcCSampleEntryBase {
  type = 'vvi1' as const;
}

export class vvs1SampleEntry extends VisualSampleEntry {
  type = 'vvs1' as const;
}

export class vvcNSampleEntry extends VisualSampleEntry {
  type = 'vvcN' as const;
}

class vpcCSampleEntryBase extends VisualSampleEntry {
  vpcC: vpcCBox;
  vpcCs: Array<vpcCBox>;
  getCodec() {
    const baseCodec = super.getCodec();
    let level: number | string = this.vpcC.level;
    if (level === 0) {
      level = '00';
    }
    let bitDepth: number | string = this.vpcC.bitDepth;
    if (bitDepth === 8) {
      bitDepth = '08';
    }
    return `${baseCodec}.0${this.vpcC.profile}.${level}.${bitDepth}`;
  }
}

export class vp08SampleEntry extends vpcCSampleEntryBase {
  type = 'vp08' as const;
}

export class vp09SampleEntry extends vpcCSampleEntryBase {
  type = 'vp09' as const;
}

export class avs3SampleEntry extends VisualSampleEntry {
  type = 'avs3' as const;
}

export class j2kiSampleEntry extends VisualSampleEntry {
  type = 'j2ki' as const;
}

export class mjp2SampleEntry extends VisualSampleEntry {
  type = 'mjp2' as const;
}

export class mjpgSampleEntry extends VisualSampleEntry {
  type = 'mjpg' as const;
}

export class uncvSampleEntry extends VisualSampleEntry {
  type = 'uncv' as const;
}

export class mp4aSampleEntry extends AudioSampleEntry {
  esds: esdsBox;
  esdss: Array<esdsBox>;

  type = 'mp4a' as const;

  getCodec() {
    const baseCodec = super.getCodec();
    if (this.esds && this.esds.esd) {
      const oti = this.esds.esd.getOTI();
      const dsi = this.esds.esd.getAudioConfig();
      return baseCodec + '.' + decimalToHex(oti) + (dsi ? '.' + dsi : '');
    } else {
      return baseCodec;
    }
  }
}

export class ac_3SampleEntry extends AudioSampleEntry {
  type = 'ac-3' as const;
}

export class ac_4SampleEntry extends AudioSampleEntry {
  type = 'ac-4' as const;
}

export class ec_3SampleEntry extends AudioSampleEntry {
  type = 'ec-3' as const;
}

export class OpusSampleEntry extends AudioSampleEntry {
  type = 'Opus' as const;
}

export class mha1SampleEntry extends AudioSampleEntry {
  type = 'mha1' as const;
}

export class mha2SampleEntry extends AudioSampleEntry {
  type = 'mha2' as const;
}

export class mhm1SampleEntry extends AudioSampleEntry {
  type = 'mhm1' as const;
}

export class mhm2SampleEntry extends AudioSampleEntry {
  type = 'mhm2' as const;
}

export class fLaCSampleEntry extends AudioSampleEntry {
  type = 'fLaC' as const;
}

// Encrypted sample entries
export class encvSampleEntry extends VisualSampleEntry {
  type = 'encv' as const;
}

export class encaSampleEntry extends AudioSampleEntry {
  type = 'enca' as const;
}

export class encuSampleEntry extends SubtitleSampleEntry {
  sinfs: Array<sinfBox> = [];
  subBoxNames = ['sinf'] as const;

  type = 'encu' as const;
}

export class encsSampleEntry extends SystemSampleEntry {
  sinfs: Array<sinfBox> = [];
  subBoxNames = ['sinf'] as const;

  type = 'encs' as const;
}

export class enctSampleEntry extends TextSampleEntry {
  sinfs: Array<sinfBox> = [];
  subBoxNames = ['sinf'] as const;

  type = 'enct' as const;
}

export class encmSampleEntry extends MetadataSampleEntry {
  sinfs: Array<sinfBox> = [];
  subBoxNames = ['sinf'] as const;

  type = 'encm' as const;
}
