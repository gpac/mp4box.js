import { Box, FullBox } from '#/box';
import { ContainerBox } from '#/containerBox';
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
import type { hvcCBox } from './hvcC';
import type { ispeBox } from './ispe';
import type { clapBox } from './clap';
import type { irotBox } from './irot';
import type { maxrBox } from './maxr';
import type { MultiBufferStream } from '#/buffer';

/**********************************************************************************/
/*                                                                                */
/*                                   Basic Boxes                                  */
/*                                                                                */
/**********************************************************************************/

export class mdatBox extends Box {
  static override readonly fourcc = 'mdat' as const;
  box_name = 'MediaDataBox' as const;
  stream?: MultiBufferStream;
}

export class idatBox extends Box {
  static override readonly fourcc = 'idat' as const;
  box_name = 'ItemDataBox' as const;
}
export class freeBox extends Box {
  static override readonly fourcc = 'free' as const;
  box_name = 'FreeSpaceBox' as const;
}
export class skipBox extends Box {
  static override readonly fourcc = 'skip' as const;
  box_name = 'FreeSpaceBox' as const;
}

/**********************************************************************************/
/*                                                                                */
/*                                   Full Boxes                                   */
/*                                                                                */
/**********************************************************************************/

export class hmhdBox extends FullBox {
  static override readonly fourcc = 'hmhd' as const;
  box_name = 'HintMediaHeaderBox' as const;
}
export class nmhdBox extends FullBox {
  static override readonly fourcc = 'nmhd' as const;
  box_name = 'NullMediaHeaderBox' as const;
}
export class iodsBox extends FullBox {
  static override readonly fourcc = 'iods' as const;
  box_name = 'ObjectDescriptorBox' as const;
}
export class xmlBox extends FullBox {
  static override readonly fourcc = 'xml ' as const;
  box_name = 'XMLBox' as const;
}
export class bxmlBox extends FullBox {
  static override readonly fourcc = 'bxml' as const;
  box_name = 'BinaryXMLBox' as const;
}
export class iproBox extends FullBox {
  static override readonly fourcc = 'ipro' as const;
  box_name = 'ItemProtectionBox' as const;

  sinfs: Array<sinfBox> = [];
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
  static override readonly fourcc = 'moov' as const;
  box_name = 'MovieBox' as const;
  timescale: number;
  mvhd: mvhdBox;
  mvhds: Array<mvhdBox>;
  mvex?: mvexBox;
  mvexs: Array<mvexBox>;
  iods: iodsBox;
  iodss: Array<iodsBox>;
  trak: trakBox;

  traks: Array<trakBox> = [];
  psshs: Array<psshBox> = [];
  subBoxNames = ['trak', 'pssh'] as const;
}
export class trakBox extends ContainerBox {
  static override readonly fourcc = 'trak' as const;
  box_name = 'TrackBox' as const;
  mdia: mdiaBox;
  mdias: Array<mdiaBox>;
  tkhd: tkhdBox;
  tkhds: Array<tkhdBox>;
  tref: trefBox;
  trefs: Array<trefBox>;
  edts?: edtsBox;
  edtss: Array<edtsBox>;
  udta: udtaBox;
  udtas: Array<udtaBox>;
  samples_duration: number;
  samples: Array<Sample> = [];
  samples_size: number;
  nextSample: number;
  lastValidSample: number;
  sample_groups_info: Array<SampleGroupInfo>;
  first_dts: number;
  first_traf_merged: boolean;
  has_fragment_subsamples: boolean;
}
export class edtsBox extends ContainerBox {
  static override readonly fourcc = 'edts' as const;
  box_name = 'EditBox' as const;
  elst: elstBox;
  elsts: Array<elstBox>;
}
export class mdiaBox extends ContainerBox {
  static override readonly fourcc = 'mdia' as const;
  box_name = 'MediaBox' as const;
  elng: elngBox;
  elngs: Array<elngBox>;
  hdlr: hdlrBox;
  hdlrs: Array<hdlrBox>;
  mdhd: mdhdBox;
  mdhds: Array<mdhdBox>;
  minf: minfBox;
  minfs: Array<minfBox>;
}
export class minfBox extends ContainerBox {
  static override readonly fourcc = 'minf' as const;
  box_name = 'MediaInformationBox' as const;
  stbl: stblBox;
  stbls: Array<stblBox>;
  hmhd: hmhdBox;
  hmhds: Array<hmhdBox>;
  vmhd?: vmhdBox;
  vmhds?: Array<vmhdBox>;
  smhd?: smhdBox;
  smhds?: Array<smhdBox>;
  sthd?: sthdBox;
  sthds?: Array<sthdBox>;
  nmhd?: nmhdBox;
  nmhds?: Array<nmhdBox>;
  dinf: dinfBox;
  dinfs: Array<dinfBox>;
  dref: drefBox;
  drefs: Array<drefBox>;
}
export class dinfBox extends ContainerBox {
  static override readonly fourcc = 'dinf' as const;
  box_name = 'DataInformationBox' as const;
}
export class stblBox extends ContainerBox {
  static override readonly fourcc = 'stbl' as const;
  box_name = 'SampleTableBox' as const;
  cslg: cslgBox;
  cslgs: Array<cslgBox>;
  stsd: stsdBox;
  stsds: Array<stsdBox>;
  stsc: stscBox;
  stscs: Array<stscBox>;
  stco: stcoBox;
  stcos: Array<stcoBox>;
  co64: co64Box;
  co64s: Array<co64Box>;
  stsz: stszBox;
  stszs: Array<stszBox>;
  stz2: stz2Box;
  stz2s: Array<stz2Box>;
  stts: sttsBox;
  sttss: Array<sttsBox>;
  ctts: cttsBox;
  cttss: Array<cttsBox>;
  stss: stssBox;
  stsss: Array<stssBox>;
  subs: subsBox;
  subss: Array<subsBox>;
  stdp: stdpBox;
  stdps: Array<stdpBox>;
  sdtp: sdtpBox;
  sdtps: Array<sdtpBox>;

  sgpds: Array<sgpdBox> = [];
  sbgps: Array<sbgpBox> = [];
  subBoxNames = ['sgpd', 'sbgp'];
}
export class mvexBox extends ContainerBox {
  static override readonly fourcc = 'mvex' as const;
  box_name = 'MovieExtendsBox' as const;
  trex: trexBox;
  mehd: mehdBox;
  mehds: Array<mehdBox>;

  trexs: Array<trexBox> = [];
  subBoxNames = ['trex'];
}
export class moofBox extends ContainerBox {
  static override readonly fourcc = 'moof' as const;
  box_name = 'MovieFragmentBox' as const;
  mfhd: mfhdBox;
  mfhds: Array<mfhdBox>;
  traf: trafBox;

  trafs: Array<trafBox> = [];
  subBoxNames = ['traf'];
}
export class trafBox extends ContainerBox {
  static override readonly fourcc = 'traf' as const;
  box_name = 'TrackFragmentBox' as const;
  subs: subsBox;
  subss: Array<subsBox>;
  tfdt: tfdtBox;
  tfdts: Array<tfdtBox>;
  tfhd: tfhdBox;
  tfhds: Array<tfhdBox>;
  trun: trunBox;

  first_sample_index: number;
  sample_number: number;
  sample_groups_info: Array<SampleGroupInfo>;

  truns: Array<trunBox> = [];
  sgpds: Array<sgpdBox> = [];
  sbgps: Array<sbgpBox> = [];
  subBoxNames = ['trun', 'sgpd', 'sbgp'];
}
export class vttcBox extends ContainerBox {
  static override readonly fourcc = 'vttc' as const;
  box_name = 'VTTCueBox' as const;
}

export class mfraBox extends ContainerBox {
  static override readonly fourcc = 'mfra' as const;
  box_name = 'MovieFragmentRandomAccessBox' as const;
  tfras: Array<tfraBox> = [];
  subBoxNames = ['tfra'] as const;
}
export class mecoBox extends ContainerBox {
  static override readonly fourcc = 'meco' as const;
  box_name = 'AdditionalMetadataContainerBox' as const;
}

export class hntiBox extends ContainerBox {
  static override readonly fourcc = 'hnti' as const;
  box_name = 'trackhintinformation' as const;
  subBoxNames = ['sdp ', 'rtp '] as const;
}
export class hinfBox extends ContainerBox {
  static override readonly fourcc = 'hinf' as const;
  box_name = 'hintstatisticsbox' as const;
  maxrs: Array<maxrBox> = [];
  subBoxNames = ['maxr'] as const;
}
export class strkBox extends ContainerBox {
  static override readonly fourcc = 'strk' as const;
  box_name = 'SubTrackBox' as const;
}
export class strdBox extends ContainerBox {
  static override readonly fourcc = 'strd' as const;
  box_name = 'SubTrackDefinitionBox' as const;
}
export class sinfBox extends ContainerBox {
  static override readonly fourcc = 'sinf' as const;
  box_name = 'ProtectionSchemeInfoBox' as const;
}
export class rinfBox extends ContainerBox {
  static override readonly fourcc = 'rinf' as const;
  box_name = 'RestrictedSchemeInfoBox' as const;
}
export class schiBox extends ContainerBox {
  static override readonly fourcc = 'schi' as const;
  box_name = 'SchemeInformationBox' as const;
}
export class trgrBox extends ContainerBox {
  static override readonly fourcc = 'trgr' as const;
  box_name = 'TrackGroupBox' as const;
}
export class udtaBox extends ContainerBox {
  static override readonly fourcc = 'udta' as const;
  box_name = 'UserDataBox' as const;
  kinds: Array<kindBox> = [];
  strks: Array<strkBox> = [];
  subBoxNames = ['kind', 'strk'] as const;
}
export class iprpBox extends ContainerBox {
  static override readonly fourcc = 'iprp' as const;
  box_name = 'ItemPropertiesBox' as const;
  ipco: ipcoBox;

  ipmas: Array<ipmaBox> = [];
  subBoxNames = ['ipma'] as const;
}
export class ipcoBox extends ContainerBox {
  static override readonly fourcc = 'ipco' as const;
  box_name = 'ItemPropertyContainerBox' as const;
  hvcCs: Array<hvcCBox> = [];
  ispes: Array<ispeBox> = [];
  claps: Array<clapBox> = [];
  irots: Array<irotBox> = [];
  subBoxNames = ['hvcC', 'ispe', 'clap', 'irot'] as const;
}
export class grplBox extends ContainerBox {
  static override readonly fourcc = 'grpl' as const;
  box_name = 'GroupsListBox' as const;
  boxes: Array<EntityToGroup>;
}
export class j2kHBox extends ContainerBox {
  static override readonly fourcc = 'j2kH' as const;
  box_name = 'J2KHeaderInfoBox' as const;
}
export class etypBox extends ContainerBox {
  static override readonly fourcc = 'etyp' as const;
  box_name = 'ExtendedTypeBox' as const;
  tycos: Array<tycoBox> = [];
  subBoxNames = ['tyco'] as const;
}
export class povdBox extends ContainerBox {
  static override readonly fourcc = 'povd' as const;
  box_name = 'ProjectedOmniVideoBox' as const;
  subBoxNames = ['prfr'] as const;
}
