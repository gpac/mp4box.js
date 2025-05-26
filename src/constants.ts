export const MAX_SIZE = Math.pow(2, 32);

// Flags
export const TKHD_FLAG_ENABLED = 0x000001;
export const TKHD_FLAG_IN_MOVIE = 0x000002;
export const TKHD_FLAG_IN_PREVIEW = 0x000004;

export const TFHD_FLAG_BASE_DATA_OFFSET = 0x01;
export const TFHD_FLAG_SAMPLE_DESC = 0x02;
export const TFHD_FLAG_SAMPLE_DUR = 0x08;
export const TFHD_FLAG_SAMPLE_SIZE = 0x10;
export const TFHD_FLAG_SAMPLE_FLAGS = 0x20;
export const TFHD_FLAG_DUR_EMPTY = 0x10000;
export const TFHD_FLAG_DEFAULT_BASE_IS_MOOF = 0x20000;

export const TRUN_FLAGS_DATA_OFFSET = 0x01;
export const TRUN_FLAGS_FIRST_FLAG = 0x04;
export const TRUN_FLAGS_DURATION = 0x100;
export const TRUN_FLAGS_SIZE = 0x200;
export const TRUN_FLAGS_FLAGS = 0x400;
export const TRUN_FLAGS_CTS_OFFSET = 0x800;

export const ERR_INVALID_DATA = -1;
export const ERR_NOT_ENOUGH_DATA = 0;
export const OK = 1;

// Constants
export const SAMPLE_ENTRY_TYPE_VISUAL = 'Visual';
export const SAMPLE_ENTRY_TYPE_AUDIO = 'Audio';
export const SAMPLE_ENTRY_TYPE_HINT = 'Hint';
export const SAMPLE_ENTRY_TYPE_METADATA = 'Metadata';
export const SAMPLE_ENTRY_TYPE_SUBTITLE = 'Subtitle';
export const SAMPLE_ENTRY_TYPE_SYSTEM = 'System';
export const SAMPLE_ENTRY_TYPE_TEXT = 'Text';
