import { Box } from '#/box';
import { DataStream } from '#/DataStream';
import { SubSample } from '#/parsing/subs';
import { MP4BoxStream } from '#/stream';
import { trakBox } from './parsing/defaults';

export type ValidStream = DataStream | MP4BoxStream;

export interface FragmentedTrack {
  id: number;
  user: unknown;
  trak: trakBox;
  segmentStream: DataStream;
  nb_samples: number;
  rapAlignement: unknown;
}
export interface ExtractedTrack {
  id: number;
  user: unknown;
  trak: trakBox;
  nb_samples: number;
  samples: Array<Sample>;
}

export interface IsoFileOptions {
  brands?: Array<string>;
  description_boxes?: Array<unknown>;
  duration?: number;
  height?: number;
  id?: number;
  language?: string;
  layer?: number;
  media_duration?: number;
  rate?: number;
  timescale?: number;
  type?: unknown;
  width?: number;
  hdlr?: string;
  name?: string;
  hevcDecoderConfigRecord?: ArrayBuffer;
  avcDecoderConfigRecord?: ArrayBuffer;
  balance?: number;
  channel_count?: number;
  samplesize?: number;
  samplerate?: number;
  namespace?: string;
  schema_location?: string;
  auxiliary_mime_types?: string;
  description?: string;
  default_sample_description_index?: number;
  default_sample_duration?: number;
  default_sample_size?: number;
  default_sample_flags?: number;
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
  grouping_type: unknown;
  grouping_type_parameter: unknown;
  group_description_index: number;
  description: Description['entries'][number];
}

export interface Track {
  alternate_group?: unknown;
  audio?: { sample_rate: number; channel_count: number; sample_size: number };
  bitrate?: unknown;
  codec?: unknown;
  created?: unknown;
  cts_shift?: unknown;
  duration?: unknown;
  edits?: unknown;
  id?: unknown;
  kind?: unknown;
  language?: unknown;
  layer?: unknown;
  matrix?: unknown;
  modified?: unknown;
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
  type?: unknown;
  video?: { width: number; height: number };
  volume?: number;
}

export interface Movie {
  hasMoov?: boolean;
  duration?: number;
  timescale?: number;
  isFragmented?: boolean;
  fragment_duration?: unknown;
  isProgressive?: boolean;
  hasIOD?: boolean;
  brands?: Array<string>;
  created?: unknown;
  modified?: unknown;
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

export type IncompleteBox =
  | {
      code: number;
      box?: undefined;
      size?: undefined;
      type?: undefined;
      hdr_size?: undefined;
      start?: undefined;
    }
  | {
      code: number;
      box: Box;
      size: number;
      type?: undefined;
      hdr_size?: undefined;
      start?: undefined;
    }
  | { code: number; type: any; size: number; hdr_size: number; start: number; box?: undefined };

export interface Item {
  id?: number;
  ref_to?: Array<{ type: unknown; id: unknown }>;
  name?: unknown;
  protection?: unknown;
  type?: unknown;
  content_type?: unknown;
  content_encoding?: unknown;
  source?: unknown;
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

export interface MP4BoxBuffer extends ArrayBuffer {
  fileStart?: number;
  usedBytes?: number;
}

export interface Nalu {
  data: Uint8Array;
  length?: number;
}

export type NaluArray = Array<Nalu> & {
  completeness: number;
  nalu_type: number;
  length: number;
};

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
  | { get(dataStream: any, struct: any): any; set?(dataStream: any, struct: any): void }
  | [name: string, type: StructDefinition];

type ArrayType = [
  '[]',
  PrimitiveType | EndianType,
  number | string | ((struct: any, dataStream: any, type: any) => number),
];

type FnType = (dataStream: DataStream, struct: Record<string, unknown>) => number;

export type StructType = PrimitiveType | EndianType | ComplexType | ArrayType | FnType;

// Recursive definition for a struct
export type StructDefinition = Array<[name: string, type: StructType]>;
