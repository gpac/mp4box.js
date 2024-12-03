import type { Box } from '#/box';
import type { trakBox } from '#/boxes/defaults';
import type { SubSample } from '#/boxes/subs';
import type { UUID_BOXES } from '#/boxes/uuid';
import type { DataStream } from '#/DataStream';
import type * as DESCRIPTORS from '#/descriptor';
import type { SampleEntry } from './all';
import type * as BOXES from './all-boxes';

type AllBoxes = Partial<typeof BOXES> & Partial<typeof UUID_BOXES>;
export namespace MP4Box {
  export interface BoxRegistry extends AllBoxes {}
  export interface DescriptorRegistry extends Partial<typeof DESCRIPTORS> {}
}

export type ValueOf<T> = T[keyof T];
export type InstanceOf<T> = T extends new (...args: any[]) => infer R ? R : never;
export type KindOf<T> = InstanceOf<ValueOf<T>>;
export type Extends<TObject, TExtends> = ValueOf<{
  [TKey in keyof TObject]: TObject[TKey] extends TExtends ? TObject[TKey] : undefined;
}>;

export type BoxKind = InstanceOf<Extends<MP4Box.BoxRegistry, typeof Box>>;
export type SampleEntryKind = InstanceOf<Extends<MP4Box.BoxRegistry, typeof SampleEntry>>;

export interface FragmentedTrack {
  id: number;
  user: unknown;
  trak: trakBox;
  segmentStream: DataStream;
  nb_samples: number;
  rapAlignement: boolean;
}
export interface ExtractedTrack {
  id: number;
  user: unknown;
  trak: trakBox;
  nb_samples: number;
  samples: Array<Sample>;
}

export interface Sample {
  alreadyRead?: number;
  cts?: number;
  data?: Uint8Array;
  degradation_priority?: number;
  depends_on?: number;
  description_index?: number;
  description?: Description['entries'][number];
  dts?: number;
  pts?: number;
  duration?: number;
  has_redundancy?: number;
  is_depended_on?: number;
  is_leading?: number;
  is_sync?: boolean;
  moof_number?: number;
  number_in_traf?: number;
  number?: number;
  offset?: number;
  size?: number;
  subsamples?: Array<SubSample>;
  timescale?: number;
  track_id?: number;
  sample_groups?: Array<SampleGroup>;
  chunk_index?: number;
  chunk_run_index?: number;
}

export interface SampleGroup {
  grouping_type: string;
  grouping_type_parameter: number;
  group_description_index?: number;
  description?: unknown;
}

export interface Track {
  alternate_group?: number;
  audio?: { sample_rate: number; channel_count: number; sample_size: number };
  bitrate?: number;
  codec?: string;
  created?: Date;
  cts_shift?: BOXES.cslgBox;
  duration?: number;
  edits?: Entry[];
  id?: number;
  kind?: BOXES.kindBox | { schemeURI: ''; value: '' };
  language?: string;
  layer?: number;
  matrix?: Matrix;
  modified?: Date;
  movie_duration?: number;
  movie_timescale?: number;
  name?: string;
  nb_samples?: number;
  references?: Array<{ track_ids: ArrayLike<number>; type: string }>;
  samples_duration?: number;
  samples?: Array<Sample>;
  size?: number;
  timescale?: number;
  track_height?: number;
  track_width?: number;
  type?: 'audio' | 'video' | 'subtitles' | 'metadata';
  video?: { width: number; height: number };
  volume?: number;
}

export interface Movie {
  hasMoov?: boolean;
  duration?: number;
  timescale?: number;
  isFragmented?: boolean;
  fragment_duration?: number;
  isProgressive?: boolean;
  hasIOD?: boolean;
  brands?: Array<string>;
  created?: Date;
  modified?: Date;
  tracks?: Array<Track>;
  audioTracks?: Array<Track>;
  videoTracks?: Array<Track>;
  subtitleTracks?: Array<Track>;
  metadataTracks?: Array<Track>;
  hintTracks?: Array<Track>;
  otherTracks?: Array<Track>;
  mime: string;
}

export interface Description {
  used: boolean;
  default_group_description_index: number;
  entries: Array<unknown>;
  version: number;
}

export type IncompleteBox = {
  code: number;
  box?: Box;
  size?: number;
  type?: string;
  hdr_size?: number;
  start?: number;
};

export interface Item {
  id?: number;
  ref_to?: Array<{
    type: string;
    id: Reference;
  }>;
  name?: string;
  protection?: unknown;
  type?: string;
  content_type?: string;
  content_encoding?: string;
  source?: Box;
  extents?: Array<{
    alreadyRead?: number;
    length: number;
    offset: number;
  }>;
  size?: number;
  properties?: { boxes: Array<Box> };
  alreadyRead?: number;
  data?: Uint8Array;
  primary?: boolean;
  sent?: boolean;
}

export type Matrix =
  | Int32Array
  | Uint32Array
  | [number, number, number, number, number, number, number, number, number];

export type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

export interface Nalu {
  data: Uint8Array;
  length?: number;
}

export type NaluArray = Array<Nalu> & {
  completeness: number;
  nalu_type: number;
  length: number;
};

export interface Output {
  log: (message: string) => void;
  indent: string;
}

export interface Entry {
  segment_duration: number;
  media_time: number;
  media_rate_integer: number;
  media_rate_fraction: number;
}

export interface Reference {
  to_item_ID: number;
}

/**********************************************************************************/
/*                                                                                */
/*                                Struct Definition                               */
/*                                                                                */
/**********************************************************************************/

type PrimitiveType =
  | 'uint8'
  | 'uint16'
  | 'uint32'
  | 'int8'
  | 'int16'
  | 'int32'
  | 'float32'
  | 'float64'
  | `u16string${'le' | 'be' | ''}`
  | 'cstring'
  | 'string'
  | `string:${number}`
  | `cstring:${number}`
  | `u16string${'' | 'le' | 'be'}:${number}`;

type EndianType = `${'uint' | 'int' | 'float'}${64 | 32 | 16 | 8}${'le' | 'be'}`;

type ComplexType =
  | {
      get(dataStream: unknown, struct: unknown): unknown;
      set?(dataStream: unknown, struct: unknown): void;
    }
  | [name: string, type: StructDefinition];

type ArrayType = [
  '[]',
  PrimitiveType | EndianType,
  number | string | ((struct: unknown, dataStream: unknown, type: unknown) => number),
];

type FnType = (dataStream: DataStream, struct: Record<string, unknown>) => number;

export type StructType = PrimitiveType | EndianType | ComplexType | ArrayType | FnType;

// Recursive definition for a struct
export type StructDefinition = Array<[name: string, type: StructType]>;
