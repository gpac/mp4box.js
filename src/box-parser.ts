import {
  Box,
  ContainerBox,
  FullBox,
  SampleEntry,
  SampleGroupEntry,
  SingleItemTypeReferenceBox,
  SingleItemTypeReferenceBoxLarge,
  TrackGroupTypeBox,
  TrackReferenceTypeBox,
} from './box';
import * as boxDiffUtils from './box-diff';
import * as boxParseUtils from './box-parse';
import * as codecsAll from './codecs-all';
import * as codecsSimple from './codecs-simple';
import { UUIDBoxes } from './parsing/uuid/index';

const ALL = true;

const BoxParserBase = {
  // Flags
  TKHD_FLAG_ENABLED: 0x000001,
  TKHD_FLAG_IN_MOVIE: 0x000002,
  TKHD_FLAG_IN_PREVIEW: 0x000004,

  TFHD_FLAG_BASE_DATA_OFFSET: 0x01,
  TFHD_FLAG_SAMPLE_DESC: 0x02,
  TFHD_FLAG_SAMPLE_DUR: 0x08,
  TFHD_FLAG_SAMPLE_SIZE: 0x10,
  TFHD_FLAG_SAMPLE_FLAGS: 0x20,
  TFHD_FLAG_DUR_EMPTY: 0x10000,
  TFHD_FLAG_DEFAULT_BASE_IS_MOOF: 0x20000,

  TRUN_FLAGS_DATA_OFFSET: 0x01,
  TRUN_FLAGS_FIRST_FLAG: 0x04,
  TRUN_FLAGS_DURATION: 0x100,
  TRUN_FLAGS_SIZE: 0x200,
  TRUN_FLAGS_FLAGS: 0x400,
  TRUN_FLAGS_CTS_OFFSET: 0x800,

  ERR_INVALID_DATA: -1,
  ERR_NOT_ENOUGH_DATA: 0,
  OK: 1,

  // Constants
  SAMPLE_ENTRY_TYPE_VISUAL: 'Visual',
  SAMPLE_ENTRY_TYPE_AUDIO: 'Audio',
  SAMPLE_ENTRY_TYPE_HINT: 'Hint',
  SAMPLE_ENTRY_TYPE_METADATA: 'Metadata',
  SAMPLE_ENTRY_TYPE_SUBTITLE: 'Subtitle',
  SAMPLE_ENTRY_TYPE_SYSTEM: 'System',
  SAMPLE_ENTRY_TYPE_TEXT: 'Text',

  // Boxes effectively created
  boxCodes: Box.codecs,
  fullBoxCodes: FullBox.codecs,
  containerBoxCodes: ContainerBox.codecs,
  sampleEntryCodes: SampleEntry.codecs,
  sampleGroupEntryCodes: SampleGroupEntry.codecs,
  trackGroupTypes: TrackGroupTypeBox.codecs,
  UUIDBoxes,
  UUIDs: Object.keys(UUIDBoxes),

  Box,
  FullBox,
  ContainerBox,
  SampleEntry,
  SampleGroupEntry,
  TrackGroupTypeBox,
  /** @bundle parsing/singleitemtypereference.js */
  SingleItemTypeReferenceBox,
  /** @bundle parsing/singleitemtypereferencelarge.js */
  SingleItemTypeReferenceBoxLarge,
  /** @bundle parsing/TrakReference.js */
  TrackReferenceTypeBox,

  ...boxParseUtils,

  /** @bundle box-codecs.js */
  decimalToHex(d: unknown, padding?: number | null) {
    let hex = Number(d).toString(16);
    padding = typeof padding === 'undefined' || padding === null ? (padding = 2) : padding;
    while (hex.length < padding) {
      hex = '0' + hex;
    }
    return hex;
  },
} as const;

export const BoxParser = ALL
  ? ({
      ...BoxParserBase,
      ...codecsAll,
      ...boxDiffUtils,
    } as const)
  : ({
      ...BoxParserBase,
      ...codecsSimple,
    } as const);
