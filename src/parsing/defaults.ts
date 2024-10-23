import { Box, ContainerBox, FullBox } from '../box';

/**********************************************************************************/
/*                                                                                */
/*                                   Basic Boxes                                  */
/*                                                                                */
/**********************************************************************************/

export const BASIC_BOXES = ['mdat', 'idat', 'free', 'skip', 'meco', 'strk'] as const;

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
export class mecoBox extends Box {
  constructor(size?: number) {
    super('meco', size);
  }
}
export class strkBox extends Box {
  constructor(size?: number) {
    super('strk', size);
  }
}

/**********************************************************************************/
/*                                                                                */
/*                                   Full Boxes                                   */
/*                                                                                */
/**********************************************************************************/

export const FULL_BOXES = ['hmhd', 'nmhd', 'iods', 'xml ', 'bxml', 'ipro', 'mere'] as const;

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
  constructor(size?: number) {
    super('ipro', size);
  }
}

/**********************************************************************************/
/*                                                                                */
/*                                Container Boxes                                 */
/*                                                                                */
/**********************************************************************************/

export const CONTAINER_BOXES = [
  ['moov', ['trak', 'pssh']],
  ['trak'],
  ['edts'],
  ['mdia'],
  ['minf'],
  ['dinf'],
  ['stbl', ['sgpd', 'sbgp']],
  ['mvex', ['trex']],
  ['moof', ['traf']],
  ['traf', ['trun', 'sgpd', 'sbgp']],
  ['vttc'],
  ['tref'],
  ['iref'],
  ['mfra', ['tfra']],
  ['meco'],
  ['hnti'],
  ['hinf'],
  ['strk'],
  ['strd'],
  ['sinf'],
  ['rinf'],
  ['schi'],
  ['trgr'],
  ['udta', ['kind']],
  ['iprp', ['ipma']],
  ['ipco'],
  ['grpl'],
  ['j2kH'],
  ['etyp', ['tyco']],
] as const;

export class moovBox extends ContainerBox {
  constructor(size?: number) {
    super('moov', size);
    this.addSubBoxArrays(['trak', 'pssh']);
  }
}
export class trakBox extends ContainerBox {
  constructor(size?: number) {
    super('trak', size);
  }
}
export class edtsBox extends ContainerBox {
  constructor(size?: number) {
    super('edts', size);
  }
}
export class mdiaBox extends ContainerBox {
  constructor(size?: number) {
    super('mdia', size);
  }
}
export class minfBox extends ContainerBox {
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
  constructor(size?: number) {
    super('stbl', size);
    this.addSubBoxArrays(['sgpd', 'sbgp']);
  }
}
export class mvexBox extends ContainerBox {
  constructor(size?: number) {
    super('mvex', size);
    this.addSubBoxArrays(['trex']);
  }
}
export class moofBox extends ContainerBox {
  constructor(size?: number) {
    super('moof', size);
    this.addSubBoxArrays(['traf']);
  }
}
export class trafBox extends ContainerBox {
  constructor(size?: number) {
    super('traf', size);
    this.addSubBoxArrays(['trun', 'sgpd', 'sbgp']);
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
export class irefBox extends ContainerBox {
  constructor(size?: number) {
    super('iref', size);
  }
}
export class mfraBox extends ContainerBox {
  constructor(size?: number) {
    super('mfra', size);
    this.addSubBoxArrays(['tfra']);
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
  constructor(size?: number) {
    super('udta', size);
    this.addSubBoxArrays(['kind']);
  }
}
export class iprpBox extends ContainerBox {
  constructor(size?: number) {
    super('iprp', size);
    this.addSubBoxArrays(['ipma']);
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
  constructor(size?: number) {
    super('etyp', size);
    this.addSubBoxArrays(['tyco']);
  }
}
