import { Box, ContainerBox, FullBox } from '#/box';
import type { co64Box } from '#/boxes/co64';
import type { cslgBox } from '#/boxes/cslg';
import type { cttsBox } from '#/boxes/ctts';
import type { elngBox } from '#/boxes/elng';
import type { elstBox } from '#/boxes/elst';
import type { hdlrBox } from '#/boxes/hdlr';
import type { ipmaBox } from '#/boxes/ipma';
import type { kindBox } from '#/boxes/kind';
import type { mdhdBox } from '#/boxes/mdhd';
import type { mehdBox } from '#/boxes/mehd';
import type { mvhdBox } from '#/boxes/mvhd';
import type { psshBox } from '#/boxes/pssh';
import type { sbgpBox } from '#/boxes/sbgp';
import type { sdtpBox } from '#/boxes/sdtp';
import type { sgpdBox } from '#/boxes/sgpd';
import type { stcoBox } from '#/boxes/stco';
import type { stdpBox } from '#/boxes/stdp';
import type { stscBox } from '#/boxes/stsc';
import type { stsdBox } from '#/boxes/stsd';
import type { stssBox } from '#/boxes/stss';
import type { stszBox } from '#/boxes/stsz';
import type { sttsBox } from '#/boxes/stts';
import type { stz2Box } from '#/boxes/stz2';
import type { subsBox } from '#/boxes/subs';
import type { tfdtBox } from '#/boxes/tfdt';
import type { tfhdBox } from '#/boxes/tfhd';
import type { tfraBox } from '#/boxes/tfra';
import type { tkhdBox } from '#/boxes/tkhd';
import type { trefBox } from '#/boxes/tref';
import type { trexBox } from '#/boxes/trex';
import type { trunBox } from '#/boxes/trun';
import type { tycoBox } from '#/boxes/tyco';
import type { SampleGroupInfo } from '#/isofile';
import type { Sample } from '@types';
import type { drefBox } from './dref';
import type { EntityToGroup } from './EntityToGroup/base';
import type { mfhdBox } from './mfhd';
import type { smhdBox } from './smhd';
import type { sthdBox } from './sthd';
import type { vmhdBox } from './vmhd';

/**********************************************************************************/
/*                                                                                */
/*                                   Basic Boxes                                  */
/*                                                                                */
/**********************************************************************************/

export class mdatBox extends Box {
  type = 'mdat' as const;
  box_name = 'MediaDataBox';
}

export class idatBox extends Box {
  type = 'idat' as const;
  box_name = 'ItemDataBox';
}
export class freeBox extends Box {
  type = 'free' as const;
  box_name = 'FreeSpaceBox';
}
export class skipBox extends Box {
  type = 'skip' as const;
  box_name = 'FreeSpaceBox';
}

// NOTE: duplicate declaration (see `mecoBox extends ContainerBox`)
// export class mecoBox extends Box {
//   type = 'meco' as const;
//   box_name = 'AdditionalMetadataContainerBox';
//   constructor(size?: number) {
//     super('meco', size);
//   }
// }

// NOTE: duplicate declaration (see `strkBox extends ContainerBox`)
// export class strkBox extends Box {
//   type = 'strk' as const;
//   box_name = 'SubTrackBox';
//   constructor(size?: number) {
//     super('strk', size);
//   }
// }

/**********************************************************************************/
/*                                                                                */
/*                                   Full Boxes                                   */
/*                                                                                */
/**********************************************************************************/

export class hmhdBox extends FullBox {
  type = 'hmhd' as const;
  box_name = 'HintMediaHeaderBox';
}
export class nmhdBox extends FullBox {
  type = 'nmhd' as const;
  box_name = 'NullMediaHeaderBox';
}
export class iodsBox extends FullBox {
  type = 'iods' as const;
  box_name = 'ObjectDescriptorBox';
}
export class xmlBox extends FullBox {
  type = 'xml ' as const;
  box_name = 'XMLBox';
}
export class bxmlBox extends FullBox {
  type = 'bxml' as const;
  box_name = 'BinaryXMLBox';
}
export class iproBox extends FullBox {
  type = 'ipro' as const;
  box_name = 'ItemProtectionBox';

  sinfs: sinfBox[] = [];
  get protections() {
    return this.sinfs;
  }
}

/**********************************************************************************/
/*                                                                                */
/*                                Container Boxes                                 */
/*                                                                                */
/**********************************************************************************/

export class moovBox extends ContainerBox {
  type = 'moov' as const;
  box_name = 'MovieBox';
  timescale: number;
  mvhd: mvhdBox;
  mvhds: mvhdBox[];
  mvex: mvexBox;
  mvexs: mvexBox[];
  iods: iodsBox;
  iodss: iodsBox[];
  trak: trakBox;

  traks: trakBox[] = [];
  psshs: psshBox[] = [];
  subBoxNames = ['trak', 'pssh'] as const;
}
export class trakBox extends ContainerBox {
  type = 'trak' as const;
  box_name = 'TrackBox';
  mdia: mdiaBox;
  mdias: mdiaBox[];
  tkhd: tkhdBox;
  tkhds: tkhdBox[];
  tref: trefBox;
  trefs: trefBox[];
  edts: edtsBox;
  edtss: edtsBox[];
  udta: udtaBox;
  udtas: udtaBox[];
  samples_duration: number;
  samples: Sample[];
  samples_size: number;
  nextSample: number;
  lastValidSample: number;
  sample_groups_info: SampleGroupInfo[];
  first_dts: number;
  first_traf_merged: boolean;
  has_fragment_subsamples: boolean;
}
export class edtsBox extends ContainerBox {
  type = 'edts' as const;
  box_name = 'EditBox';
  elst: elstBox;
  elsts: elstBox[];
}
export class mdiaBox extends ContainerBox {
  type = 'mdia' as const;
  box_name = 'MediaBox';
  elng: elngBox;
  elngs: elngBox[];
  hdlr: hdlrBox;
  hdlrs: hdlrBox[];
  mdhd: mdhdBox;
  mdhds: mdhdBox[];
  minf: minfBox;
  minfs: minfBox[];
}
export class minfBox extends ContainerBox {
  type = 'minf' as const;
  box_name = 'MediaInformationBox';
  stbl: stblBox;
  stbls: stblBox[];
  hmhd: hmhdBox;
  hmhds: hmhdBox[];
  vmhd?: vmhdBox;
  vmhds?: vmhdBox[];
  smhd?: smhdBox;
  smhds?: smhdBox[];
  sthd?: sthdBox;
  sthds?: sthdBox[];
  nmhd?: nmhdBox;
  nmhds?: nmhdBox[];
  dinf: dinfBox;
  dinfs: dinfBox[];
  dref: drefBox;
  drefs: drefBox[];
}
export class dinfBox extends ContainerBox {
  type = 'dinf' as const;
  box_name = 'DataInformationBox';
}
export class stblBox extends ContainerBox {
  type = 'stbl' as const;
  box_name = 'SampleTableBox';
  cslg: cslgBox;
  cslgs: cslgBox[];
  stsd: stsdBox;
  stsds: stsdBox[];
  stsc: stscBox;
  stscs: stscBox[];
  stco: stcoBox;
  stcos: stcoBox[];
  co64: co64Box;
  co64s: co64Box[];
  stsz: stszBox;
  stszs: stszBox[];
  stz2: stz2Box;
  stz2s: stz2Box[];
  stts: sttsBox;
  sttss: sttsBox[];
  ctts: cttsBox;
  cttss: cttsBox[];
  stss: stssBox;
  stsss: stssBox[];
  subs: subsBox;
  subss: subsBox[];
  stdp: stdpBox;
  stdps: stdpBox[];
  sdtp: sdtpBox;
  sdtps: sdtpBox[];

  sgpds: sgpdBox[] = [];
  sbgps: sbgpBox[] = [];
  subBoxNames = ['sgpd', 'sbgp'];
}
export class mvexBox extends ContainerBox {
  type = 'mvex' as const;
  box_name = 'MovieExtendsBox';
  trex: trexBox;
  mehd: mehdBox;
  mehds: mehdBox[];

  trexs: trexBox[] = [];
  subBoxNames = ['trex'];
}
export class moofBox extends ContainerBox {
  type = 'moof' as const;
  box_name = 'MovieFragmentBox';
  mfhd: mfhdBox;
  mfhds: mfhdBox[];
  traf: trafBox;

  trafs: trafBox[] = [];
  subBoxNames = ['traf'];
}
export class trafBox extends ContainerBox {
  type = 'traf' as const;
  box_name = 'TrackFragmentBox';
  subs: subsBox;
  subss: subsBox[];
  tfdt: tfdtBox;
  tfdts: tfdtBox[];
  tfhd: tfhdBox;
  tfhds: tfhdBox[];
  trun: trunBox;

  first_sample_index: number;
  sample_number: number;
  sample_groups_info: SampleGroupInfo[];

  truns: trunBox[] = [];
  sgpds: sgpdBox[] = [];
  sbgps: sbgpBox[] = [];
  subBoxNames = ['trun', 'sgpd', 'sbgp'];
}
export class vttcBox extends ContainerBox {
  type = 'vttc' as const;
  box_name = 'VTTCueBox';
}

export class mfraBox extends ContainerBox {
  type = 'mfra' as const;
  box_name = 'MovieFragmentRandomAccessBox';
  tfras: tfraBox[] = [];
  subBoxNames = ['tfra'] as const;
}
export class mecoBox extends ContainerBox {
  type = 'meco' as const;
  box_name = 'AdditionalMetadataContainerBox';
}

export class hntiBox extends ContainerBox {
  type = 'hnti' as const;
  box_name = 'trackhintinformation';
}
export class hinfBox extends ContainerBox {
  type = 'hinf' as const;
  box_name = 'hintstatisticsbox';
}
export class strkBox extends ContainerBox {
  type = 'strk' as const;
  box_name = 'SubTrackBox';
}
export class strdBox extends ContainerBox {
  type = 'strd' as const;
  box_name = 'SubTrackDefinitionBox';
}
export class sinfBox extends ContainerBox {
  type = 'sinf' as const;
  box_name = 'ProtectionSchemeInfoBox';
}
export class rinfBox extends ContainerBox {
  type = 'rinf' as const;
  box_name = 'RestrictedSchemeInfoBox';
}
export class schiBox extends ContainerBox {
  type = 'schi' as const;
  box_name = 'SchemeInformationBox';
}
export class trgrBox extends ContainerBox {
  type = 'trgr' as const;
  box_name = 'TrackGroupBox';
}
export class udtaBox extends ContainerBox {
  type = 'udta' as const;
  box_name = 'UserDataBox';
  kinds: kindBox[] = [];
  subBoxNames = ['kind'] as const;
}
export class iprpBox extends ContainerBox {
  type = 'iprp' as const;
  box_name = 'ItemPropertiesBox';
  ipco: ipcoBox;

  ipmas: ipmaBox[] = [];
  subBoxNames = ['ipma'] as const;
}
export class ipcoBox extends ContainerBox {
  type = 'ipco' as const;
  box_name = 'ItemPropertyContainerBox';
}
export class grplBox extends ContainerBox {
  type = 'grpl' as const;
  box_name = 'GroupsListBox';
  declare boxes: EntityToGroup[];
}
export class j2kHBox extends ContainerBox {
  type = 'j2kH' as const;
  box_name = 'J2KHeaderInfoBox';
}
export class etypBox extends ContainerBox {
  type = 'etyp' as const;
  box_name = 'ExtendedTypeBox';
  tycos: tycoBox[] = [];
  subBoxNames = ['tyco'] as const;
}
