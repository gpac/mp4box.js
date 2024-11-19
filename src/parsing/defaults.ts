import { Box, ContainerBox, FullBox } from '#/box';
import { SampleGroupInfo } from '#/isofile';
import { co64Box } from '#/parsing/co64';
import { cslgBox } from '#/parsing/cslg';
import { cttsBox } from '#/parsing/ctts';
import { elngBox } from '#/parsing/elng';
import { elstBox } from '#/parsing/elst';
import { hdlrBox } from '#/parsing/hdlr';
import { ipmaBox } from '#/parsing/ipma';
import { kindBox } from '#/parsing/kind';
import { mdhdBox } from '#/parsing/mdhd';
import { mehdBox } from '#/parsing/mehd';
import { mvhdBox } from '#/parsing/mvhd';
import { psshBox } from '#/parsing/pssh';
import { sbgpBox } from '#/parsing/sbgp';
import { sgpdBox } from '#/parsing/sgpd';
import { stcoBox } from '#/parsing/stco';
import { stdpBox } from '#/parsing/stdp';
import { stscBox } from '#/parsing/stsc';
import { stsdBox } from '#/parsing/stsd';
import { stssBox } from '#/parsing/stss';
import { stszBox } from '#/parsing/stsz';
import { sttsBox } from '#/parsing/stts';
import { stz2Box } from '#/parsing/stz2';
import { subsBox } from '#/parsing/subs';
import { tfraBox } from '#/parsing/tfra';
import { tkhdBox } from '#/parsing/tkhd';
import { trexBox } from '#/parsing/trex';
import { trunBox } from '#/parsing/trun';
import { tycoBox } from '#/parsing/tyco';
import type { Sample } from '#/types';
import { sdtpBox } from './sdtp';
import { tfdtBox } from './tfdt';
import { tfhdBox } from './tfhd';

/**********************************************************************************/
/*                                                                                */
/*                                   Basic Boxes                                  */
/*                                                                                */
/**********************************************************************************/

export class mdatBox extends Box {
  constructor(size?: number) {
    super('mdat', size);
  }
}

export class idatBox extends Box {
  constructor(size?: number) {
    super('idat', size);
  }
}
export class freeBox extends Box {
  constructor(size?: number) {
    super('free', size);
  }
}
export class skipBox extends Box {
  constructor(size?: number) {
    super('skip', size);
  }
}

// NOTE: duplicate declaration (see `mecoBox extends ContainerBox`)
// export class mecoBox extends Box {
//   constructor(size?: number) {
//     super('meco', size);
//   }
// }

// NOTE: duplicate declaration (see `strkBox extends ContainerBox`)
// export class strkBox extends Box {
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
  constructor(size?: number) {
    super('hmhd', size);
  }
}
export class nmhdBox extends FullBox {
  constructor(size?: number) {
    super('nmhd', size);
  }
}
export class iodsBox extends FullBox {
  constructor(size?: number) {
    super('iods', size);
  }
}
export class xmlBox extends FullBox {
  constructor(size?: number) {
    super('xml ', size);
  }
}
export class bxmlBox extends FullBox {
  constructor(size?: number) {
    super('bxml', size);
  }
}
export class iproBox extends FullBox {
  protections: Array<unknown>;
  constructor(size?: number) {
    super('ipro', size);
  }
}

/**********************************************************************************/
/*                                                                                */
/*                                Container Boxes                                 */
/*                                                                                */
/**********************************************************************************/

export class moovBox extends ContainerBox {
  timescale: number;
  mvhd: mvhdBox;
  mvex: mvexBox;
  iods: iodsBox;
  traks: Array<trakBox> = [];
  psshs: Array<psshBox> = [];
  subBoxNames = ['trak', 'pssh'] as const;

  constructor(size?: number) {
    super('moov', size);
  }
}
export class trakBox extends ContainerBox {
  mdia: mdiaBox;
  tkhd: tkhdBox;
  tref: trefBox;
  edts: edtsBox;
  samples_duration: number;
  udta: udtaBox;
  samples: Array<Sample>;
  samples_size: number;
  nextSample: number;
  lastValidSample: number;
  sample_groups_info: Array<SampleGroupInfo>;
  first_dts?: number;
  first_traf_merged?: boolean;
  has_fragment_subsamples?: boolean;

  constructor(size?: number) {
    super('trak', size);
  }
}
export class edtsBox extends ContainerBox {
  elst: elstBox;
  constructor(size?: number) {
    super('edts', size);
  }
}
export class mdiaBox extends ContainerBox {
  elng?: elngBox;
  hdlr?: hdlrBox;
  mdhd: mdhdBox;
  minf: minfBox;

  constructor(size?: number) {
    super('mdia', size);
  }
}
export class minfBox extends ContainerBox {
  stbl: stblBox;
  constructor(size?: number) {
    super('minf', size);
  }
}
export class dinfBox extends ContainerBox {
  constructor(size?: number) {
    super('dinf', size);
  }
}
export class stblBox extends ContainerBox {
  cslg: cslgBox;
  stsd: stsdBox;
  stsc?: stscBox;
  stco?: stcoBox;
  co64?: co64Box;
  stsz?: stszBox;
  stz2?: stz2Box;
  stts?: sttsBox;
  ctts?: cttsBox;
  stss?: stssBox;
  subs?: subsBox;
  stdp?: stdpBox;
  sdtp?: sdtpBox;

  sgpds: Array<sgpdBox> = [];
  sbgps: Array<sbgpBox> = [];
  subBoxNames = ['sgpd', 'sbgp'];
  constructor(size?: number) {
    super('stbl', size);
  }
}
export class mvexBox extends ContainerBox {
  mehd: mehdBox;

  trexs: Array<trexBox> = [];
  subBoxNames = ['trex'];

  constructor(size?: number) {
    super('mvex', size);
  }
}
export class moofBox extends ContainerBox {
  trafs: Array<trafBox> = [];
  subBoxNames = ['traf'];
  constructor(size?: number) {
    super('moof', size);
  }
}
export class trafBox extends ContainerBox {
  first_sample_index?: number;
  sample_number?: number;
  tfhd?: tfhdBox;
  tfdt?: tfdtBox;
  subs?: subsBox;

  truns: Array<trunBox> = [];
  sgpds: Array<sgpdBox> = [];
  sbgps: Array<sbgpBox> = [];
  subBoxNames = ['trun', 'sgpd', 'sbgp'];

  sample_groups_info?: Array<SampleGroupInfo>;

  constructor(size?: number) {
    super('traf', size);
  }
}
export class vttcBox extends ContainerBox {
  constructor(size?: number) {
    super('vttc', size);
  }
}
export class trefBox extends ContainerBox {
  constructor(size?: number) {
    super('tref', size);
  }
}

// NOTE: also imported from parsing/iref.ts
// export class irefBox extends ContainerBox {
//   constructor(size?: number) {
//     super('iref', size);
//   }
// }
export class mfraBox extends ContainerBox {
  tfras: Array<tfraBox> = [];
  subBoxNames = ['tfra'] as const;
  constructor(size?: number) {
    super('mfra', size);
  }
}
export class mecoBox extends ContainerBox {
  constructor(size?: number) {
    super('meco', size);
  }
}

export class hntiBox extends ContainerBox {
  constructor(size?: number) {
    super('hnti', size);
  }
}
export class hinfBox extends ContainerBox {
  constructor(size?: number) {
    super('hinf', size);
  }
}
export class strkBox extends ContainerBox {
  constructor(size?: number) {
    super('strk', size);
  }
}
export class strdBox extends ContainerBox {
  constructor(size?: number) {
    super('strd', size);
  }
}
export class sinfBox extends ContainerBox {
  constructor(size?: number) {
    super('sinf', size);
  }
}
export class rinfBox extends ContainerBox {
  constructor(size?: number) {
    super('rinf', size);
  }
}
export class schiBox extends ContainerBox {
  constructor(size?: number) {
    super('schi', size);
  }
}
export class trgrBox extends ContainerBox {
  constructor(size?: number) {
    super('trgr', size);
  }
}
export class udtaBox extends ContainerBox {
  kinds: Array<kindBox> = [];
  subBoxNames = ['kind'] as const;
  constructor(size?: number) {
    super('udta', size);
  }
}
export class iprpBox extends ContainerBox {
  ipco?: ipcoBox;

  ipmas: Array<ipmaBox> = [];
  subBoxNames = ['ipma'] as const;
  constructor(size?: number) {
    super('iprp', size);
  }
}
export class ipcoBox extends ContainerBox {
  constructor(size?: number) {
    super('ipco', size);
  }
}
export class grplBox extends ContainerBox {
  constructor(size?: number) {
    super('grpl', size);
  }
}
export class j2kHBox extends ContainerBox {
  constructor(size?: number) {
    super('j2kH', size);
  }
}
export class etypBox extends ContainerBox {
  tycos: Array<tycoBox> = [];
  subBoxNames = ['tyco'] as const;
  constructor(size?: number) {
    super('etyp', size);
  }
}
