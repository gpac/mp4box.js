import { Box, ContainerBox, FullBox } from '#/box';
import { co64Box } from '#/boxes/co64';
import { cslgBox } from '#/boxes/cslg';
import { cttsBox } from '#/boxes/ctts';
import { elngBox } from '#/boxes/elng';
import { elstBox } from '#/boxes/elst';
import { hdlrBox } from '#/boxes/hdlr';
import { ipmaBox } from '#/boxes/ipma';
import { kindBox } from '#/boxes/kind';
import { mdhdBox } from '#/boxes/mdhd';
import { mehdBox } from '#/boxes/mehd';
import { mvhdBox } from '#/boxes/mvhd';
import { psshBox } from '#/boxes/pssh';
import { sbgpBox } from '#/boxes/sbgp';
import { sgpdBox } from '#/boxes/sgpd';
import { stcoBox } from '#/boxes/stco';
import { stdpBox } from '#/boxes/stdp';
import { stscBox } from '#/boxes/stsc';
import { stsdBox } from '#/boxes/stsd';
import { stssBox } from '#/boxes/stss';
import { stszBox } from '#/boxes/stsz';
import { sttsBox } from '#/boxes/stts';
import { stz2Box } from '#/boxes/stz2';
import { subsBox } from '#/boxes/subs';
import { tfraBox } from '#/boxes/tfra';
import { tkhdBox } from '#/boxes/tkhd';
import { trexBox } from '#/boxes/trex';
import { trunBox } from '#/boxes/trun';
import { tycoBox } from '#/boxes/tyco';
import { SampleGroupInfo } from '#/isofile';
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
  first_dts: number;
  first_traf_merged: boolean;
  has_fragment_subsamples: boolean;

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
  elng: elngBox;
  hdlr: hdlrBox;
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
  stsc: stscBox;
  stco: stcoBox;
  co64: co64Box;
  stsz: stszBox;
  stz2: stz2Box;
  stts: sttsBox;
  ctts: cttsBox;
  stss: stssBox;
  subs: subsBox;
  stdp: stdpBox;
  sdtp: sdtpBox;

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
  first_sample_index: number;
  sample_number: number;
  tfhd: tfhdBox;
  tfdt: tfdtBox;
  subs: subsBox;
  sample_groups_info: Array<SampleGroupInfo>;

  truns: Array<trunBox> = [];
  sgpds: Array<sgpdBox> = [];
  sbgps: Array<sbgpBox> = [];
  subBoxNames = ['trun', 'sgpd', 'sbgp'];

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
  ipco: ipcoBox;

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
