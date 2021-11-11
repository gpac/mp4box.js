import type { MultiBufferStream } from './buffer';
import type { Box } from './box';

export type Track = any;

export type Movie = any;

interface TrackObject {
  id: number;
  user: string;
  trak: any;
  samples: any[];
}

export type ExtractedTrackObject = Partial<TrackObject> & {
  nb_samples: number;
};
export type FragmentedTrackObject = Partial<TrackObject> & {
  segmentStream?: MultiBufferStream;
  rapAlignement: boolean;
  nb_samples: number;
};

export type TrackOptions = {
  type: string;
  description_boxes: any;
  width?: number;
  height?: number;
};

interface Options {
  nbSamples: number;
  rapAlignement: boolean;
}

export type SegmentOptions = Partial<Options>;
export type ExtractOptions = Partial<Options>;

export interface BoxRange {
  start: number;
  end: number;
}

export type NumberArray =
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint16Array
  | Uint8Array
  | Uint32Array
  | Float32Array
  | Float64Array;

export interface Sample {
  id: number;
  track_id: number;
  is_sync: boolean;
  type: string;

  size: number;
  dts: number;
  cts: number;
  pts: number;
  timescale: number;
  duration: number;
  rate: number;
  layer: number;
  width: number;
  height: number;
  alreadyRead: number;
  offset: number;
  has_redundancy: number;
  is_depended_on: number;
  is_leading: number;
  depends_on: number;
  description_index: number;
  chunk_index: number;

  data: NumberArray;

  sample_groups: any;
}

// export type Sample = any;

export interface ParseOneBoxResponse {
  code: number;
  box?: Box;
  type?: string;
  size?: number;
  hdr_size?: number;
  start?: number;
}

export interface PrintOutput {
  indent: string;
  log: (msg: string) => void;
}
