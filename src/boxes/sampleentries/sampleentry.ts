import { av1CBox } from '#/boxes/av1C';
import { avcCBox } from '#/boxes/avcC';
import { sinfBox } from '#/boxes/defaults';
import { esdsBox } from '#/boxes/esds';
import { hvcCBox } from '#/boxes/hvcC';
import { vpcCBox } from '#/boxes/vpcC';
import { vvcCBox } from '#/boxes/vvcC';
import { colrBox } from '#/boxes/colr';
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
  avcC: avcCBox;
  avcCs: Array<avcCBox>;

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
  static override readonly fourcc = 'avc1' as const;
}

export class avc2SampleEntry extends avcCSampleEntryBase {
  static override readonly fourcc = 'avc2' as const;
}

export class avc3SampleEntry extends avcCSampleEntryBase {
  static override readonly fourcc = 'avc3' as const;
}

export class avc4SampleEntry extends avcCSampleEntryBase {
  static override readonly fourcc = 'avc4' as const;
}

export class av01SampleEntry extends VisualSampleEntry {
  av1C: av1CBox;
  av1Cs: Array<av1CBox>;

  static override readonly fourcc = 'av01' as const;

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
  static override readonly fourcc = 'dav1' as const;
}

class hvcCSampleEntryBase extends VisualSampleEntry {
  hvcC: hvcCBox;
  hvcCs: Array<hvcCBox>;

  /** @bundle box-codecs.js */
  getCodec(): string {
    let baseCodec = super.getCodec();
    if (this.hvcC) {
      baseCodec += '.';
      switch (this.hvcC.general_profile_space) {
        case 0:
          baseCodec += '';
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
        if (i === 31) break;
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
  static override readonly fourcc = 'hvc1' as const;
}

export class hvc2SampleEntry extends hvcCSampleEntryBase {
  static override readonly fourcc = 'hvc2' as const;
}

export class hev1SampleEntry extends hvcCSampleEntryBase {
  static override readonly fourcc = 'hev1' as const;
  colrs: Array<colrBox> = [];
  subBoxNames = ['colr'] as const;
}

export class hev2SampleEntry extends hvcCSampleEntryBase {
  static override readonly fourcc = 'hev2' as const;
}

export class hvt1SampleEntry extends VisualSampleEntry {
  static override readonly fourcc = 'hvt1' as const;
}

export class lhe1SampleEntry extends VisualSampleEntry {
  static override readonly fourcc = 'lhe1' as const;
}

export class lhv1SampleEntry extends VisualSampleEntry {
  static override readonly fourcc = 'lhv1' as const;
}

export class dvh1SampleEntry extends VisualSampleEntry {
  static override readonly fourcc = 'dvh1' as const;
}

export class dvheSampleEntry extends VisualSampleEntry {
  static override readonly fourcc = 'dvhe' as const;
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
  static override readonly fourcc = 'vvc1' as const;
}

export class vvi1SampleEntry extends vvcCSampleEntryBase {
  static override readonly fourcc = 'vvi1' as const;
}

export class vvs1SampleEntry extends VisualSampleEntry {
  static override readonly fourcc = 'vvs1' as const;
}

export class vvcNSampleEntry extends VisualSampleEntry {
  static override readonly fourcc = 'vvcN' as const;
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
  static override readonly fourcc = 'vp08' as const;
}

export class vp09SampleEntry extends vpcCSampleEntryBase {
  static override readonly fourcc = 'vp09' as const;
}

export class avs3SampleEntry extends VisualSampleEntry {
  static override readonly fourcc = 'avs3' as const;
}

export class j2kiSampleEntry extends VisualSampleEntry {
  static override readonly fourcc = 'j2ki' as const;
}

export class mjp2SampleEntry extends VisualSampleEntry {
  static override readonly fourcc = 'mjp2' as const;
}

export class mjpgSampleEntry extends VisualSampleEntry {
  static override readonly fourcc = 'mjpg' as const;
}

export class uncvSampleEntry extends VisualSampleEntry {
  static override readonly fourcc = 'uncv' as const;
}

export class mp4vSampleEntry extends VisualSampleEntry {
  static override readonly fourcc = 'mp4v' as const;
}

export class mp4aSampleEntry extends AudioSampleEntry {
  static override readonly fourcc = 'mp4a' as const;

  esds: esdsBox;
  esdss: Array<esdsBox>;

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

export class m4aeSampleEntry extends AudioSampleEntry {
  static override readonly fourcc = 'm4ae' as const;
}

export class ac_3SampleEntry extends AudioSampleEntry {
  static override readonly fourcc = 'ac-3' as const;
}

export class ac_4SampleEntry extends AudioSampleEntry {
  static override readonly fourcc = 'ac-4' as const;
}

export class ec_3SampleEntry extends AudioSampleEntry {
  static override readonly fourcc = 'ec-3' as const;
}

export class OpusSampleEntry extends AudioSampleEntry {
  static override readonly fourcc = 'Opus' as const;
}

export class mha1SampleEntry extends AudioSampleEntry {
  static override readonly fourcc = 'mha1' as const;
}

export class mha2SampleEntry extends AudioSampleEntry {
  static override readonly fourcc = 'mha2' as const;
}

export class mhm1SampleEntry extends AudioSampleEntry {
  static override readonly fourcc = 'mhm1' as const;
}

export class mhm2SampleEntry extends AudioSampleEntry {
  static override readonly fourcc = 'mhm2' as const;
}

export class fLaCSampleEntry extends AudioSampleEntry {
  static override readonly fourcc = 'fLaC' as const;
}

export class av3aSampleEntry extends AudioSampleEntry {
  static override readonly fourcc = 'av3a' as const;
}

export class a3asSampleEntry extends AudioSampleEntry {
  static override readonly fourcc = 'a3as' as const;
}

// Encrypted sample entries
export class encvSampleEntry extends VisualSampleEntry {
  static override readonly fourcc = 'encv' as const;
}

export class encaSampleEntry extends AudioSampleEntry {
  static override readonly fourcc = 'enca' as const;
}

export class encuSampleEntry extends SubtitleSampleEntry {
  static override readonly fourcc = 'encu' as const;
  subBoxNames = ['sinf'] as const;

  sinfs: Array<sinfBox> = [];
}

export class encsSampleEntry extends SystemSampleEntry {
  static override readonly fourcc = 'encs' as const;
  subBoxNames = ['sinf'] as const;

  sinfs: Array<sinfBox> = [];
}

export class mp4sSampleEntry extends SystemSampleEntry {
  static override readonly fourcc = 'mp4s' as const;

  esds: esdsBox;
}

export class enctSampleEntry extends TextSampleEntry {
  static override readonly fourcc = 'enct' as const;
  subBoxNames = ['sinf'] as const;

  sinfs: Array<sinfBox> = [];
}

export class encmSampleEntry extends MetadataSampleEntry {
  static override readonly fourcc = 'encm' as const;
  subBoxNames = ['sinf'] as const;

  sinfs: Array<sinfBox> = [];
}

// Restricted sample entries
export class resvSampleEntry extends VisualSampleEntry {
  static override readonly fourcc = 'resv' as const;
}
