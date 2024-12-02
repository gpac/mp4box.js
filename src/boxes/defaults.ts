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

/**********************************************************************************/
/*                                                                                */
/*                                   Basic Boxes                                  */
/*                                                                                */
/**********************************************************************************/

export class mdatBox extends Box {
  type = 'mdat' as const;
  constructor(size?: number) {
    super(size);
  }
}

export class idatBox extends Box {
  type = 'idat' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class freeBox extends Box {
  type = 'free' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class skipBox extends Box {
  type = 'skip' as const;
  constructor(size?: number) {
    super(size);
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
  type = 'hmhd' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class nmhdBox extends FullBox {
  type = 'nmhd' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class iodsBox extends FullBox {
  type = 'iods' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class xmlBox extends FullBox {
  type = 'xml ' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class bxmlBox extends FullBox {
  type = 'bxml' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class iproBox extends FullBox {
  protections: Array<unknown>;

  type = 'ipro' as const;
  constructor(size?: number) {
    super(size);
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

  type = 'moov' as const;
  constructor(size?: number) {
    super(size);
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

  type = 'trak' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class edtsBox extends ContainerBox {
  elst: elstBox;

  type = 'edts' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class mdiaBox extends ContainerBox {
  elng: elngBox;
  hdlr?: hdlrBox;
  mdhd: mdhdBox;
  minf: minfBox;

  type = 'mdia' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class minfBox extends ContainerBox {
  stbl: stblBox;

  type = 'minf' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class dinfBox extends ContainerBox {
  type = 'dinf' as const;
  constructor(size?: number) {
    super(size);
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

  type = 'stbl' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class mvexBox extends ContainerBox {
  mehd: mehdBox;

  trexs: Array<trexBox> = [];
  subBoxNames = ['trex'];

  type = 'mvex' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class moofBox extends ContainerBox {
  trafs: Array<trafBox> = [];
  subBoxNames = ['traf'];

  type = 'moof' as const;
  constructor(size?: number) {
    super(size);
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

  type = 'traf' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class vttcBox extends ContainerBox {
  type = 'vttc' as const;
  constructor(size?: number) {
    super(size);
  }
}

export class mfraBox extends ContainerBox {
  tfras: Array<tfraBox> = [];
  subBoxNames = ['tfra'] as const;

  type = 'mfra' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class mecoBox extends ContainerBox {
  type = 'meco' as const;
  constructor(size?: number) {
    super(size);
  }
}

export class hntiBox extends ContainerBox {
  type = 'hnti' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class hinfBox extends ContainerBox {
  type = 'hinf' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class strkBox extends ContainerBox {
  type = 'strk' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class strdBox extends ContainerBox {
  type = 'strd' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class sinfBox extends ContainerBox {
  type = 'sinf' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class rinfBox extends ContainerBox {
  type = 'rinf' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class schiBox extends ContainerBox {
  type = 'schi' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class trgrBox extends ContainerBox {
  type = 'trgr' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class udtaBox extends ContainerBox {
  kinds: Array<kindBox> = [];
  subBoxNames = ['kind'] as const;

  type = 'udta' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class iprpBox extends ContainerBox {
  ipco: ipcoBox;

  ipmas: Array<ipmaBox> = [];
  subBoxNames = ['ipma'] as const;

  type = 'iprp' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class ipcoBox extends ContainerBox {
  type = 'ipco' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class grplBox extends ContainerBox {
  type = 'grpl' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class j2kHBox extends ContainerBox {
  type = 'j2kH' as const;
  constructor(size?: number) {
    super(size);
  }
}
export class etypBox extends ContainerBox {
  tycos: Array<tycoBox> = [];
  subBoxNames = ['tyco'] as const;

  type = 'etyp' as const;
  constructor(size?: number) {
    super(size);
  }
}
