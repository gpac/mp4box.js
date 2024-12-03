import type { Box, SampleGroupEntry } from '#/box';
import type { trakBox } from '#/boxes/defaults';
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

export type ValueOf<T> = T[keyof T];
export type InstanceOf<T> = T extends new (...args: Array<any>) => infer R ? R : never;
export type KindOf<T> = InstanceOf<ValueOf<T>>;
export type Extends<TObject, TExtends> = {
  [TKey in keyof TObject]: TObject[TKey] extends TExtends ? TObject[TKey] : undefined;
}[keyof TObject];

export type TupleOf<T, N extends number, R extends T[] = []> = R['length'] extends N
  ? R
  : TupleOf<T, N, [T, ...R]>;
export type NumberTuple<T extends number> = TupleOf<number, T>;

export type BoxKind = InstanceOf<Extends<MP4Box.BoxRegistry, typeof Box>>;
export type SampleEntryKind = InstanceOf<Extends<MP4Box.BoxRegistry, typeof SampleEntry>>;

export interface FragmentedTrack<TUser> {
  id: number;
  user: TUser;
  trak: trakBox;
  segmentStream: DataStream;
  nb_samples: number;
  rapAlignement: boolean;
}
export interface ExtractedTrack<TUser> {
  id: number;
  user: TUser;
  trak: trakBox;
  nb_samples: number;
  samples: Array<Sample>;
}

export interface Sample {
  alreadyRead?: number;
  chunk_index?: number;
  chunk_run_index?: number;
  cts: number;
  data?: Uint8Array;
  degradation_priority: number;
  depends_on: number;
  description_index: number;
  description: Description['entries'][number];
  dts: number;
  duration: number;
  has_redundancy: number;
  is_depended_on: number;
  is_leading: number;
  is_sync: boolean;
  moof_number?: number;
  number_in_traf?: number;
  number: number;
  offset: number;
  pts?: number;
  sample_groups?: Array<SampleGroup>;
  size: number;
  subsamples?: Array<SubSample>;
  timescale: number;
  track_id: number;
}

export interface SampleGroup {
  grouping_type: string;
  grouping_type_parameter: number;
  group_description_index?: number;
  description?: SampleEntry | SampleGroupEntry;
}

export interface Track {
  alternate_group: number;
  audio?: { sample_rate: number; channel_count: number; sample_size: number };
  bitrate: number;
  codec: string;
  created: Date;
  cts_shift: BOXES.cslgBox;
  duration: number;
  edits?: Entry[];
  id: number;
  kind: BOXES.kindBox | { schemeURI: ''; value: '' };
  language: string;
  layer: number;
  matrix: Matrix;
  modified: Date;
  movie_duration: number;
  movie_timescale: number;
  name: string;
  nb_samples: number;
  references: Array<{ track_ids: ArrayLike<number>; type: string }>;
  samples_duration: number;
  samples?: Array<Sample>;
  size: number;
  timescale: number;
  track_height: number;
  track_width: number;
  type?: 'audio' | 'video' | 'subtitles' | 'metadata';
  video?: { width: number; height: number };
  volume: number;
}

export interface Movie {
  hasMoov: boolean;
  audioTracks: Array<Track>;
  brands: Array<string>;
  created: Date;
  duration: number;
  fragment_duration: number | undefined;
  hasIOD: boolean;
  hintTracks: Array<Track>;
  isFragmented: boolean;
  isProgressive: boolean;
  metadataTracks: Array<Track>;
  mime: string;
  modified: Date;
  otherTracks: Array<Track>;
  subtitleTracks: Array<Track>;
  timescale: number;
  tracks: Array<Track>;
  videoTracks: Array<Track>;
}

export interface Description {
  default_group_description_index: number;
  entries: Array<SampleGroupEntry | SampleEntry>;
  used: boolean;
  version: number;
}

export type IncompleteBox = {
  box?: Box;
  code: number;
  hdr_size?: number;
  size?: number;
  start?: number;
  type?: string;
};

export interface Item {
  alreadyRead?: number;
  content_encoding?: string;
  content_type?: string;
  data?: Uint8Array;
  extents?: Array<{
    alreadyRead?: number;
    length: number;
    offset: number;
  }>;
  id?: number;
  name?: string;
  primary?: boolean;
  properties?: { boxes: Array<Box> };
  protection?: unknown;
  ref_to?: Array<{
    type: string;
    id: Reference;
  }>;
  sent?: boolean;
  size?: number;
  source?: Box;
  type?: string;
}

export interface EntityGroup {
  id: number;
  entity_ids: Array<number>;
  type: string;
  properties?: {
    boxes: Array<Box>;
  };
}

export interface SubSample {
  size: number;
  priority: number;
  discardable: number;
  codec_specific_parameters: number;
}

export type Matrix =
  | Int32Array
  | Uint32Array
  | [number, number, number, number, number, number, number, number, number];

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

export type Charset =
  | 'ASCII'
  | 'UTF-8'
  | 'UTF-16LE'
  | 'UTF-16BE'
  | 'ISO-8859-1'
  | 'ISO-8859-2'
  | 'ISO-8859-3'
  | 'ISO-8859-4'
  | 'ISO-8859-5'
  | 'ISO-8859-6'
  | 'ISO-8859-7'
  | 'ISO-8859-8'
  | 'ISO-8859-9'
  | 'ISO-8859-10'
  | 'ISO-8859-11'
  | 'ISO-8859-13'
  | 'ISO-8859-14'
  | 'ISO-8859-15'
  | 'ISO-8859-16'
  | 'Windows-1250'
  | 'Windows-1251'
  | 'Windows-1252'
  | 'Windows-1253'
  | 'Windows-1254'
  | 'Windows-1255'
  | 'Windows-1256'
  | 'Windows-1257'
  | 'Windows-1258'
  | 'KOI8-R'
  | 'KOI8-U'
  | 'Big5'
  | 'GBK'
  | 'GB18030'
  | 'Shift_JIS';

export type SimpleNumberType =
  | 'uint8'
  | 'uint16'
  | 'uint32'
  | 'int8'
  | 'int16'
  | 'int32'
  | 'float32'
  | 'float64';
export type EndianNumberType =
  | `${'uint' | 'int'}${32 | 16}${'le' | 'be'}`
  | `float${64 | 32}${'le' | 'be'}`;
export type NumberType = SimpleNumberType | EndianNumberType;

export type SimpleStringType = 'cstring' | 'string';
export type EncodedStringType = `${SimpleStringType},${Charset}`;
export type LengthStringType = `${SimpleStringType}:${number}`;
export type EncodedLengthStringType = `${EncodedStringType}:${number}`;
export type EndianStringType = `u16string${'' | 'le' | 'be'}:${number}`;
export type StringType =
  | SimpleStringType
  | EncodedStringType
  | LengthStringType
  | EncodedLengthStringType
  | EndianStringType;

export type GetterSetterType<T = any> = {
  get(dataStream: DataStream, struct: Record<string, Type>): T;
  set?(dataStream: DataStream, value: T, struct?: Record<string, Type>): void;
};

export type TupleType = [
  '[]',
  Type,
  (
    | number
    | '*'
    | (string & {})
    | ((struct: Record<string, Type>, dataStream: DataStream, type: Type) => number)
  ),
];

export type FnType = <T = any>(dataStream: DataStream, struct: T) => number;

export type Type =
  | NumberType
  | StringType
  | EndianNumberType
  | GetterSetterType
  | TupleType
  | FnType
  | StructDefinition;

export type ParsedType =
  | StructDefinition
  | TupleType
  | `cstring`
  | `string`
  | `u16string${'' | 'le' | 'be'}`
  | SimpleNumberType
  | EndianNumberType;

export type StructDefinition = Array<[name: string, type: Type]>;

export type ValueFromType<TValue extends Type> = TValue extends StringType
  ? string
  : TValue extends NumberType
  ? number
  : TValue extends FnType
  ? ReturnType<FnType>
  : TValue extends GetterSetterType
  ? ReturnType<TValue['get']>
  : TValue extends ['[]', NumberType, infer TAmount]
  ? TAmount extends number
    ? TupleOf<number, TAmount>
    : TAmount extends () => infer TReturnType
    ? TReturnType extends number
      ? TupleOf<number, TReturnType>
      : never
    : Array<number>
  : TValue extends StructDefinition
  ? StructDataFromStructDefinition<TValue>
  : never;

export type StructDataFromStructDefinition<T extends StructDefinition> = {
  [TKey in T[number][0]]: Extract<T[number], [TKey, any]>[1] extends infer TValue
    ? TValue extends Type
      ? ValueFromType<TValue>
      : never
    : never;
};
