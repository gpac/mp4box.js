/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */

import { Box } from '#/box';
import { boxEqual } from '#/box-diff';
import { avcCBox } from '#/boxes/avcC';
import {
  dinfBox,
  hmhdBox,
  mdatBox,
  mdiaBox,
  minfBox,
  moofBox,
  moovBox,
  mvexBox,
  nmhdBox,
  stblBox,
  trafBox,
  trakBox,
} from '#/boxes/defaults';
import { drefBox } from '#/boxes/dref';
import { elngBox } from '#/boxes/elng';
import { ftypBox } from '#/boxes/ftyp';
import { hdlrBox } from '#/boxes/hdlr';
import { hvcCBox } from '#/boxes/hvcC';
import { mdhdBox } from '#/boxes/mdhd';
import { mehdBox } from '#/boxes/mehd';
import { metaBox } from '#/boxes/meta';
import { mfhdBox } from '#/boxes/mfhd';
import { mvhdBox } from '#/boxes/mvhd';
import { stppSampleEntry } from '#/boxes/sampleentries';
import {
  AudioSampleEntry,
  HintSampleEntry,
  MetadataSampleEntry,
  SubtitleSampleEntry,
  SystemSampleEntry,
  VisualSampleEntry,
} from '#/boxes/sampleentries/base';
import { sbgpBox } from '#/boxes/sbgp';
import { sdtpBox } from '#/boxes/sdtp';
import { sgpdBox } from '#/boxes/sgpd';
import { sidxBox } from '#/boxes/sidx';
import { smhdBox } from '#/boxes/smhd';
import { stcoBox } from '#/boxes/stco';
import { sthdBox } from '#/boxes/sthd';
import { stscBox } from '#/boxes/stsc';
import { stsdBox } from '#/boxes/stsd';
import { stszBox } from '#/boxes/stsz';
import { sttsBox } from '#/boxes/stts';
import { tfdtBox } from '#/boxes/tfdt';
import { tfhdBox } from '#/boxes/tfhd';
import { tkhdBox } from '#/boxes/tkhd';
import { trexBox } from '#/boxes/trex';
import { trunBox } from '#/boxes/trun';
import { urlBox } from '#/boxes/url';
import { vmhdBox } from '#/boxes/vmhd';
import { MultiBufferStream } from '#/buffer';
import {
  ERR_INVALID_DATA,
  ERR_NOT_ENOUGH_DATA,
  OK,
  TFHD_FLAG_BASE_DATA_OFFSET,
  TFHD_FLAG_DEFAULT_BASE_IS_MOOF,
  TFHD_FLAG_SAMPLE_DESC,
  TFHD_FLAG_SAMPLE_DUR,
  TFHD_FLAG_SAMPLE_FLAGS,
  TFHD_FLAG_SAMPLE_SIZE,
  TKHD_FLAG_ENABLED,
  TKHD_FLAG_IN_MOVIE,
  TKHD_FLAG_IN_PREVIEW,
  TRUN_FLAGS_CTS_OFFSET,
  TRUN_FLAGS_DATA_OFFSET,
  TRUN_FLAGS_DURATION,
  TRUN_FLAGS_FIRST_FLAG,
  TRUN_FLAGS_FLAGS,
  TRUN_FLAGS_SIZE,
} from '#/constants';
import { DataStream } from '#/DataStream';
import { Log } from '#/log';
import { BoxRegistry } from '#/registry';
import type {
  AllIdentifiers,
  AllRegisteredBoxes,
  BoxKind,
  Description,
  EntityGroup,
  ExtractedTrack,
  FragmentedTrack,
  IncompleteBox,
  Item,
  Movie,
  Output,
  Sample,
  SampleEntryFourCC,
  SubSample,
  Track,
} from '@types';
import { MP4BoxBuffer } from '#/mp4boxbuffer';
import { parseOneBox } from '#/parser';

export class SampleGroupInfo {
  last_sample_in_run = -1;
  entry_index = -1;

  description: Description;
  fragment_description: Description;
  is_fragment: boolean;

  constructor(
    public grouping_type: string,
    public grouping_type_parameter: number,
    public sbgp?: sbgpBox,
  ) {}
}

export interface IsoFileOptions {
  brands?: Array<string>;
  description_boxes?: Array<BoxKind>;
  duration?: number;
  height?: number;
  id?: number;
  language?: string;
  layer?: number;
  media_duration?: number;
  rate?: number;
  timescale?: number;
  type?: SampleEntryFourCC;
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
  description?: Box;
  default_sample_description_index?: number;
  default_sample_duration?: number;
  default_sample_size?: number;
  default_sample_flags?: number;
}

export class ISOFile<TSegmentUser = unknown, TSampleUser = unknown> {
  /** MutiBufferStream object used to parse boxes */
  stream: MultiBufferStream;
  /** Array of all boxes (in order) found in the file */
  boxes: Array<Box> = [];
  /** Array of all mdats */
  mdats: Array<mdatBox> = [];
  /** Array of all moofs */
  moofs: Array<moofBox> = [];
  /** Boolean indicating if the file is compatible with progressive parsing (moov first) */
  isProgressive = false;
  /** Boolean used to fire moov start event only once */
  moovStartFound = false;
  /** Callback called when the moov parsing starts */
  onMoovStart?: () => void;
  /** Boolean keeping track of the call to onMoovStart, to avoid double calls */
  moovStartSent = false;
  /** Callback called when the moov is entirely parsed */
  onReady?: (info: Movie) => void;
  /** Boolean keeping track of the call to onReady, to avoid double calls */
  readySent = false;
  /** Callback to call when segments are ready */
  onSegment?: (
    id: number,
    user: TSegmentUser,
    buffer: ArrayBuffer,
    nextSample: number,
    last: boolean,
  ) => void;
  /** Callback to call when samples are ready */
  onSamples?: (id: number, user: TSampleUser, samples: Array<Sample>) => void;
  /** Callback to call when there is an error in the parsing or processing of samples */
  onError?: (module: string, message: string) => void;
  /** Callback to call when an item is processed */
  onItem?: () => void;
  /** Boolean indicating if the moov box run-length encoded tables of sample information have been processed */
  sampleListBuilt = false;
  /** Array of Track objects for which fragmentation of samples is requested */
  fragmentedTracks: Array<FragmentedTrack<TSegmentUser>> = [];
  /** Array of Track objects for which extraction of samples is requested */
  extractedTracks: Array<ExtractedTrack<TSampleUser>> = [];
  /** Boolean indicating that fragmention is ready */
  isFragmentationInitialized = false;
  /** Boolean indicating that fragmented has started */
  sampleProcessingStarted = false;
  /** Number of the next 'moof' to generate when fragmenting */
  nextMoofNumber = 0;
  /** Boolean indicating if the initial list of items has been produced */
  itemListBuilt = false;
  /** Callback called when the sidx box is entirely parsed */
  onSidx?: (sidx: sidxBox) => void;
  /** Boolean keeping track of the call to onSidx, to avoid double calls */
  sidxSent = false;

  /** @bundle isofile-item-processing.js */
  items: Array<Item> = [];

  /** @bundle isofile-item-processing.js */
  entity_groups: Array<EntityGroup> = [];

  /**
   * size of the buffers allocated for samples
   * @bundle isofile-item-processing.js
   */
  itemsDataSize = 0;

  moov: moovBox;
  moovs: Array<moovBox>;
  sidx: sidxBox;
  sidxs: Array<sidxBox>;
  meta: metaBox;
  metas: Array<metaBox>;
  ftyp: ftypBox;
  ftyps: Array<ftypBox>;
  nextSeekPosition: number;
  initial_duration: number;

  constructor(stream?: MultiBufferStream, discardMdatData = true) {
    this.discardMdatData = discardMdatData;
    if (stream) {
      this.stream = stream;
      this.parse();
    } else {
      this.stream = new MultiBufferStream();
    }
    this.stream.isofile = this;
  }

  setSegmentOptions(
    id: number,
    user: TSegmentUser,
    opts: Partial<{
      nbSamples: number;
      nbSamplesPerFragment: number;
      sizePerSegment: number;
      rapAlignement: boolean;
    }>,
  ) {
    // Destructure and provide defaults for optional properties
    const { sizePerSegment = Number.MAX_SAFE_INTEGER, rapAlignement = true } = opts;

    // Set defaults for sample counts
    let nbSamples = opts.nbSamples ?? opts.nbSamplesPerFragment ?? 1000;
    const nbSamplesPerFragment = opts.nbSamplesPerFragment ?? nbSamples;

    // Validate number of samples
    if (nbSamples <= 0 || nbSamplesPerFragment <= 0 || sizePerSegment <= 0) {
      Log.error(
        'ISOFile',
        `Invalid segment options: nbSamples=${nbSamples}, nbSamplesPerFragment=${nbSamplesPerFragment}, sizePerSegment=${sizePerSegment}`,
      );
      return;
    }

    // Check if the number of samples is valid
    if (nbSamples < nbSamplesPerFragment) {
      Log.warn(
        'ISOFile',
        `nbSamples (${nbSamples}) is less than nbSamplesPerFragment (${nbSamplesPerFragment}), setting nbSamples to nbSamplesPerFragment`,
      );
      nbSamples = nbSamplesPerFragment;
    }

    // Number of samples per segment must be same across all tracks
    if (this.fragmentedTracks.some(track => track.nb_samples !== nbSamples)) {
      Log.error(
        'ISOFile',
        `Cannot set segment options for track ${id}: nbSamples (${nbSamples}) does not match existing tracks`,
      );
      return;
    }

    const trak = this.getTrackById(id);
    if (trak) {
      const fragTrack: FragmentedTrack<TSegmentUser> = {
        id,
        user,
        trak,
        segmentStream: undefined,
        nb_samples: nbSamples,
        nb_samples_per_fragment: nbSamplesPerFragment,
        size_per_segment: sizePerSegment,
        rapAlignement,
        state: {
          lastFragmentSampleNumber: 0,
          lastSegmentSampleNumber: 0,
          accumulatedSize: 0,
        },
      };
      this.fragmentedTracks.push(fragTrack);
      trak.nextSample = 0;
    }

    if (this.discardMdatData) {
      Log.warn(
        'ISOFile',
        'Segmentation options set but discardMdatData is true, samples will not be segmented',
      );
    }
  }

  unsetSegmentOptions(id: number) {
    let index = -1;
    for (let i = 0; i < this.fragmentedTracks.length; i++) {
      const fragTrack = this.fragmentedTracks[i];
      if (fragTrack.id === id) {
        index = i;
      }
    }
    if (index > -1) {
      this.fragmentedTracks.splice(index, 1);
    }
  }

  setExtractionOptions(
    id: number,
    user?: TSampleUser,
    { nbSamples: nb_samples = 1000 }: { nbSamples?: number } = {},
  ) {
    const trak = this.getTrackById(id);
    if (trak) {
      this.extractedTracks.push({
        id,
        user,
        trak,
        nb_samples,
        samples: [],
      });
      trak.nextSample = 0;
    }

    if (this.discardMdatData) {
      Log.warn(
        'ISOFile',
        'Extraction options set but discardMdatData is true, samples will not be extracted',
      );
    }
  }

  unsetExtractionOptions(id: number) {
    let index = -1;
    for (let i = 0; i < this.extractedTracks.length; i++) {
      const extractTrack = this.extractedTracks[i];
      if (extractTrack.id === id) {
        index = i;
      }
    }
    if (index > -1) {
      this.extractedTracks.splice(index, 1);
    }
  }

  parse() {
    const parseBoxHeadersOnly = false;

    if (this.restoreParsePosition) {
      if (!this.restoreParsePosition()) {
        return;
      }
    }

    while (true) {
      if (this.hasIncompleteMdat && this.hasIncompleteMdat()) {
        if (this.processIncompleteMdat()) {
          continue;
        } else {
          return;
        }
      } else {
        if (this.saveParsePosition) {
          this.saveParsePosition();
        }
        const ret = parseOneBox(this.stream, parseBoxHeadersOnly);
        if (ret.code === ERR_NOT_ENOUGH_DATA) {
          if (this.processIncompleteBox) {
            if (this.processIncompleteBox(ret)) {
              continue;
            } else {
              return;
            }
          } else {
            return;
          }
        } else if (ret.code === OK) {
          /* the box is entirely parsed */
          const box = ret.box as BoxKind;
          /* store the box in the 'boxes' array to preserve box order (for file rewrite if needed)  */
          this.boxes.push(box);
          if (box.type === 'uuid') {
            if (this[box.uuid] !== undefined) {
              Log.warn(
                'ISOFile',
                'Duplicate Box of uuid: ' + box.uuid + ', overriding previous occurrence',
              );
            }
            this[box.uuid] = box;
          } else {
            /* but also store box in a property for more direct access */
            switch (box.type) {
              case 'mdat':
                this.mdats.push(box as mdatBox);
                this.transferMdatData(box as mdatBox);
                break;
              case 'moof':
                this.moofs.push(box as moofBox);
                break;
              case 'free':
              case 'skip':
                break;
              case 'moov':
                this.moovStartFound = true;
                if (this.mdats.length === 0) {
                  this.isProgressive = true;
                }
              /* no break */
              /* falls through */
              default:
                if (this[box.type] !== undefined) {
                  if (Array.isArray(this[box.type + 's'])) {
                    Log.info(
                      'ISOFile',
                      `Found multiple boxes of type ${box.type} in ISOFile, adding to array`,
                    );
                    this[box.type + 's'].push(box);
                  } else {
                    Log.warn(
                      'ISOFile',
                      `Found multiple boxes of type ${box.type} but no array exists. Creating array dynamically.`,
                    );
                    this[box.type + 's'] = [this[box.type], box];
                  }
                } else {
                  this[box.type] = box;
                  if (Array.isArray(this[box.type + 's'])) {
                    this[box.type + 's'].push(box);
                  }
                }
                break;
            }
          }
          if (this.updateUsedBytes) {
            this.updateUsedBytes(box, ret);
          }
        } else if (ret.code === ERR_INVALID_DATA) {
          Log.error(
            'ISOFile',
            `Invalid data found while parsing box of type '${ret.type}' at position ${ret.start}. Aborting parsing.`,
            this,
          );
          break;
        }
      }
    }
  }

  checkBuffer(ab?: MP4BoxBuffer) {
    if (!ab) throw new Error('Buffer must be defined and non empty');
    if (ab.byteLength === 0) {
      Log.warn('ISOFile', 'Ignoring empty buffer (fileStart: ' + ab.fileStart + ')');
      this.stream.logBufferLevel();
      return false;
    }
    Log.info('ISOFile', 'Processing buffer (fileStart: ' + ab.fileStart + ')');

    /* mark the bytes in the buffer as not being used yet */
    ab.usedBytes = 0;
    this.stream.insertBuffer(ab);
    this.stream.logBufferLevel();

    if (!this.stream.initialized()) {
      Log.warn('ISOFile', 'Not ready to start parsing');
      return false;
    }
    return true;
  }

  /**
   * Processes a new ArrayBuffer (with a fileStart property)
   * Returns the next expected file position, or undefined if not ready to parse
   */
  appendBuffer(ab: MP4BoxBuffer, last?: boolean) {
    let nextFileStart: number;
    if (!this.checkBuffer(ab)) {
      return;
    }

    /* Parse whatever is in the existing buffers */
    this.parse();

    /* Check if the moovStart callback needs to be called */
    if (this.moovStartFound && !this.moovStartSent) {
      this.moovStartSent = true;
      if (this.onMoovStart) this.onMoovStart();
    }

    if (this.moov) {
      /* A moov box has been entirely parsed */

      /* if this is the first call after the moov is found we initialize the list of samples (may be empty in fragmented files) */
      if (!this.sampleListBuilt) {
        this.buildSampleLists();
        this.sampleListBuilt = true;
      }

      /* We update the sample information if there are any new moof boxes */
      this.updateSampleLists();

      /* If the application needs to be informed that the 'moov' has been found,
         we create the information object and callback the application */
      if (this.onReady && !this.readySent) {
        this.readySent = true;
        this.onReady(this.getInfo());
      }

      /* See if any sample extraction or segment creation needs to be done with the available samples */
      this.processSamples(last);

      /* Inform about the best range to fetch next */
      if (this.nextSeekPosition) {
        nextFileStart = this.nextSeekPosition;
        this.nextSeekPosition = undefined;
      } else {
        nextFileStart = this.nextParsePosition;
      }
      if (this.stream.getEndFilePositionAfter) {
        nextFileStart = this.stream.getEndFilePositionAfter(nextFileStart);
      }
    } else {
      if (this.nextParsePosition) {
        /* moov has not been parsed but the first buffer was received,
           the next fetch should probably be the next box start */
        nextFileStart = this.nextParsePosition;
      } else {
        /* No valid buffer has been parsed yet, we cannot know what to parse next */
        nextFileStart = 0;
      }
    }
    if (this.sidx) {
      if (this.onSidx && !this.sidxSent) {
        this.onSidx(this.sidx);
        this.sidxSent = true;
      }
    }
    if (this.meta) {
      if (this.flattenItemInfo && !this.itemListBuilt) {
        this.flattenItemInfo();
        this.itemListBuilt = true;
      }
      if (this.processItems) {
        this.processItems(this.onItem);
      }
    }

    if (this.stream.cleanBuffers) {
      Log.info(
        'ISOFile',
        'Done processing buffer (fileStart: ' +
          ab.fileStart +
          ') - next buffer to fetch should have a fileStart position of ' +
          nextFileStart,
      );
      this.stream.logBufferLevel();
      this.stream.cleanBuffers();
      this.stream.logBufferLevel(true);
      Log.info('ISOFile', 'Sample data size in memory: ' + this.getAllocatedSampleDataSize());
    }
    return nextFileStart;
  }

  getFragmentDuration() {
    const mvex = this.getBox('mvex');
    if (!mvex) return;

    // Use mehd if available
    if (mvex.mehd) {
      return {
        num: mvex.mehd.fragment_duration,
        den: this.moov.mvhd.timescale,
      };
    }

    // Find the longest track
    const traks = this.getBoxes('trak', false);
    let maximum = { num: 0, den: 1 };

    for (const trak of traks) {
      const duration = trak.samples_duration;
      const timescale = trak.mdia.mdhd.timescale;
      if (duration && timescale) {
        const ratio = duration / timescale;
        if (ratio > maximum.num / maximum.den) {
          maximum = { num: duration, den: timescale };
        }
      }
    }

    return maximum;
  }

  getInfo(): Movie {
    if (!this.moov) {
      return {
        hasMoov: false,
        mime: '',
      } as Movie;
    }

    const _1904 = new Date('1904-01-01T00:00:00Z').getTime();
    const isFragmented = this.getBox('mvex') !== undefined;

    const movie: Movie = {
      hasMoov: true,
      duration: this.moov.mvhd.duration,
      timescale: this.moov.mvhd.timescale,
      isFragmented,
      fragment_duration: this.getFragmentDuration(),
      isProgressive: this.isProgressive,
      hasIOD: this.moov.iods !== undefined,
      brands: [this.ftyp.major_brand].concat(this.ftyp.compatible_brands),
      created: new Date(_1904 + this.moov.mvhd.creation_time * 1000),
      modified: new Date(_1904 + this.moov.mvhd.modification_time * 1000),
      tracks: [] as Array<Track>,
      audioTracks: [] as Array<Track>,
      videoTracks: [] as Array<Track>,
      subtitleTracks: [] as Array<Track>,
      metadataTracks: [] as Array<Track>,
      hintTracks: [] as Array<Track>,
      otherTracks: [] as Array<Track>,
      mime: '',
    };

    for (let i = 0; i < this.moov.traks.length; i++) {
      const trak = this.moov.traks[i];

      const sample_desc = trak.mdia.minf.stbl.stsd.entries[0];

      const size = trak.samples_size;
      const track_timescale = trak.mdia.mdhd.timescale;
      const samples_duration = trak.samples_duration;
      const bitrate = (size * 8 * track_timescale) / samples_duration;

      const track: Track = {
        samples_duration,
        bitrate,
        size,
        timescale: track_timescale,
        alternate_group: trak.tkhd.alternate_group,
        codec: sample_desc.getCodec(),
        created: new Date(_1904 + trak.tkhd.creation_time * 1000),
        cts_shift: trak.mdia.minf.stbl.cslg,
        duration: trak.mdia.mdhd.duration,
        id: trak.tkhd.track_id,
        kind:
          trak.udta && trak.udta.kinds.length ? trak.udta.kinds[0] : { schemeURI: '', value: '' },
        // NOTE:   trak.mdia.elng used to be trak.mdia.eln
        language: trak.mdia.elng ? trak.mdia.elng.extended_language : trak.mdia.mdhd.languageString,
        layer: trak.tkhd.layer,
        matrix: trak.tkhd.matrix,
        modified: new Date(_1904 + trak.tkhd.modification_time * 1000),
        movie_duration: trak.tkhd.duration,
        movie_timescale: movie.timescale,
        name: trak.mdia.hdlr.name,
        nb_samples: trak.samples.length,
        references: [],
        track_height: trak.tkhd.height / (1 << 16),
        track_width: trak.tkhd.width / (1 << 16),
        volume: trak.tkhd.volume,
      };

      movie.tracks.push(track);

      if (trak.tref) {
        for (let j = 0; j < trak.tref.references.length; j++) {
          track.references.push({
            type: trak.tref.references[j].type,
            track_ids: trak.tref.references[j].track_ids,
          });
        }
      }

      if (trak.edts) {
        track.edits = trak.edts.elst.entries;
      }

      if (sample_desc instanceof AudioSampleEntry) {
        track.type = 'audio';
        movie.audioTracks.push(track);
        track.audio = {
          sample_rate: sample_desc.getSampleRate(),
          channel_count: sample_desc.getChannelCount(),
          sample_size: sample_desc.getSampleSize(),
        };
      } else if (sample_desc instanceof VisualSampleEntry) {
        track.type = 'video';
        movie.videoTracks.push(track);
        track.video = {
          width: sample_desc.getWidth(),
          height: sample_desc.getHeight(),
        };
      } else if (sample_desc instanceof SubtitleSampleEntry) {
        track.type = 'subtitles';
        movie.subtitleTracks.push(track);
      } else if (sample_desc instanceof HintSampleEntry) {
        track.type = 'metadata';
        movie.hintTracks.push(track);
      } else if (sample_desc instanceof MetadataSampleEntry) {
        track.type = 'metadata';
        movie.metadataTracks.push(track);
      } else {
        track.type = 'metadata';
        movie.otherTracks.push(track);
      }
    }

    if (movie.videoTracks && movie.videoTracks.length > 0) {
      movie.mime += 'video/mp4; codecs="';
    } else if (movie.audioTracks && movie.audioTracks.length > 0) {
      movie.mime += 'audio/mp4; codecs="';
    } else {
      movie.mime += 'application/mp4; codecs="';
    }
    for (let i = 0; i < movie.tracks.length; i++) {
      if (i !== 0) movie.mime += ',';
      movie.mime += movie.tracks[i].codec;
    }
    movie.mime += '"; profiles="';
    movie.mime += this.ftyp.compatible_brands.join();
    movie.mime += '"';

    return movie;
  }

  setNextSeekPositionFromSample(sample: Sample) {
    if (!sample) {
      return;
    }
    if (this.nextSeekPosition) {
      this.nextSeekPosition = Math.min(sample.offset + sample.alreadyRead, this.nextSeekPosition);
    } else {
      this.nextSeekPosition = sample.offset + sample.alreadyRead;
    }
  }

  processSamples(last?: boolean) {
    if (!this.sampleProcessingStarted) return;

    /* For each track marked for fragmentation,
       check if the next sample is there (i.e. if the sample information is known (i.e. moof has arrived) and if it has been downloaded)
       and create a fragment with it */
    if (this.isFragmentationInitialized && this.onSegment !== undefined) {
      const consumedTracks = new Set<number>();
      while (
        consumedTracks.size < this.fragmentedTracks.length &&
        this.fragmentedTracks.some(track => track.trak.nextSample < track.trak.samples.length) &&
        this.sampleProcessingStarted
      ) {
        for (const fragTrak of this.fragmentedTracks) {
          const trak = fragTrak.trak;
          if (!consumedTracks.has(fragTrak.id)) {
            // Check if the sample is available
            const sample =
              trak.nextSample < trak.samples.length
                ? this.getSample(trak, trak.nextSample)
                : undefined;
            if (!sample) {
              this.setNextSeekPositionFromSample(trak.samples[trak.nextSample]);
              /* The fragment cannot not be created because the media data is not there (not downloaded), wait for it */
              consumedTracks.add(fragTrak.id);
              continue;
            }

            // Accumulate the size of the sample in the fragment state
            fragTrak.state.accumulatedSize += sample.size;

            // Check if fragment or segment are overdue or if we are at a boundary
            const sampleNum = trak.nextSample + 1;
            const isFragmentOverdue =
              sampleNum - fragTrak.state.lastFragmentSampleNumber >
              fragTrak.nb_samples_per_fragment;
            const isSegmentOverdue =
              sampleNum - fragTrak.state.lastSegmentSampleNumber > fragTrak.nb_samples;
            let isFragmentBoundary =
              isFragmentOverdue || sampleNum % fragTrak.nb_samples_per_fragment === 0;
            let isSegmentBoundary = isSegmentOverdue || sampleNum % fragTrak.nb_samples === 0;

            // Check if the segment size is reached
            let isSizeBoundary = fragTrak.state.accumulatedSize >= fragTrak.size_per_segment;

            // Check if the sample is a RAP (Random Access Point)
            const isRAP = !fragTrak.rapAlignement || sample.is_sync;

            // During flush, we create a fragment even if we are not at a boundary
            const isFlush = last || trak.nextSample + 1 >= trak.samples.length;
            if (isFlush && !isRAP) {
              Log.warn(
                'ISOFile',
                'Flushing track #' +
                  fragTrak.id +
                  ' at sample #' +
                  trak.nextSample +
                  ' which is not a RAP, this may lead to playback issues',
              );
            }

            // Align fragment/segment boundaries with RAPs if requested
            isFragmentBoundary = isFragmentBoundary && isRAP;
            isSegmentBoundary = isSegmentBoundary && isRAP;
            isSizeBoundary = isSizeBoundary && isRAP;

            // Create a fragment if needed
            if (isFragmentBoundary || isSizeBoundary || isFlush) {
              if (isFragmentOverdue) {
                Log.warn(
                  'ISOFile',
                  'Fragment on track #' +
                    fragTrak.id +
                    ' is overdue, creating it with samples [' +
                    fragTrak.state.lastFragmentSampleNumber +
                    ', ' +
                    trak.nextSample +
                    ']',
                );
              } else {
                Log.debug(
                  'ISOFile',
                  'Creating media fragment on track #' +
                    fragTrak.id +
                    ' for samples [' +
                    fragTrak.state.lastFragmentSampleNumber +
                    ', ' +
                    trak.nextSample +
                    ']',
                );
              }

              const result = this.createFragment(
                fragTrak.id,
                fragTrak.state.lastFragmentSampleNumber,
                trak.nextSample,
                fragTrak.segmentStream,
              );
              if (result) {
                fragTrak.segmentStream = result;
                fragTrak.state.lastFragmentSampleNumber = trak.nextSample + 1;
              } else {
                /* The fragment could not be created because the media data is not there (not downloaded), wait for it */
                consumedTracks.add(fragTrak.id);
                continue;
              }
            }

            /* A fragment is created by a collection of samples, but the segment is the accumulation in the
            buffer of these fragments. It is flushed only as requested by the application (nb_samples)
            to avoid too many callbacks */
            if (isSegmentBoundary || isSizeBoundary || isFlush) {
              if (isSegmentOverdue) {
                Log.warn(
                  'ISOFile',
                  'Segment on track #' +
                    fragTrak.id +
                    ' is overdue, sending it with samples [' +
                    Math.max(0, trak.nextSample - fragTrak.nb_samples) +
                    ', ' +
                    (trak.nextSample - 1) +
                    ']',
                );
              } else {
                Log.info(
                  'ISOFile',
                  'Sending fragmented data on track #' +
                    fragTrak.id +
                    ' for samples [' +
                    Math.max(0, trak.nextSample - fragTrak.nb_samples) +
                    ', ' +
                    (trak.nextSample - 1) +
                    ']',
                );
              }
              Log.info(
                'ISOFile',
                'Sample data size in memory: ' + this.getAllocatedSampleDataSize(),
              );
              if (this.onSegment) {
                this.onSegment(
                  fragTrak.id,
                  fragTrak.user,
                  fragTrak.segmentStream.buffer,
                  trak.nextSample + 1,
                  last || trak.nextSample + 1 >= trak.samples.length,
                );
              }
              /* force the creation of a new buffer */
              fragTrak.segmentStream = undefined;
              // Reset the accumulated size and sample number
              fragTrak.state.accumulatedSize = 0;
              fragTrak.state.lastSegmentSampleNumber = trak.nextSample + 1;
            }

            // Advance to the next sample
            trak.nextSample++;
          }
        }
      }
    }

    if (this.onSamples !== undefined) {
      /* For each track marked for data export,
         check if the next sample is there (i.e. has been downloaded) and send it */
      for (let i = 0; i < this.extractedTracks.length; i++) {
        const extractTrak = this.extractedTracks[i];
        const trak = extractTrak.trak;
        while (trak.nextSample < trak.samples.length && this.sampleProcessingStarted) {
          Log.debug(
            'ISOFile',
            'Exporting on track #' + extractTrak.id + ' sample #' + trak.nextSample,
          );
          const sample = this.getSample(trak, trak.nextSample);
          if (sample) {
            trak.nextSample++;
            extractTrak.samples.push(sample);
          } else {
            this.setNextSeekPositionFromSample(trak.samples[trak.nextSample]);
            break;
          }
          if (
            trak.nextSample % extractTrak.nb_samples === 0 ||
            trak.nextSample >= trak.samples.length
          ) {
            Log.debug(
              'ISOFile',
              'Sending samples on track #' + extractTrak.id + ' for sample ' + trak.nextSample,
            );
            if (this.onSamples) {
              this.onSamples(extractTrak.id, extractTrak.user, extractTrak.samples);
            }
            extractTrak.samples = [];
            if (extractTrak !== this.extractedTracks[i]) {
              /* check if the extraction needs to be stopped */
              break;
            }
          }
        }
      }
    }
  }

  /* Find and return specific boxes using recursion and early return */
  getBox<T extends AllIdentifiers>(type: T): AllRegisteredBoxes[T] {
    const result = this.getBoxes(type, true);
    return result.length ? result[0] : undefined;
  }

  getBoxes<T extends AllIdentifiers>(type: T, returnEarly: boolean) {
    const result: Array<AllRegisteredBoxes[T]> = [];

    const sweep = (root: Box | ISOFile) => {
      if (root instanceof Box && root.type && root.type === type) {
        result.push(root as unknown as AllRegisteredBoxes[T]);
      }

      const inner: Array<Box> = [];
      if (root['boxes']) inner.push(...root.boxes);
      if (root['entries']) inner.push(...(root['entries'] as Array<Box>));
      if (root['item_infos']) inner.push(...(root['item_infos'] as Array<Box>));
      if (root['references']) inner.push(...(root['references'] as Array<Box>));

      for (const box of inner) {
        if (result.length && returnEarly) return;
        sweep(box);
      }
    };

    sweep(this);
    return result;
  }

  getTrackSamplesInfo(track_id: number) {
    const track = this.getTrackById(track_id);
    if (track) {
      return track.samples;
    }
  }

  getTrackSample(track_id: number, number: number) {
    const track = this.getTrackById(track_id);
    const sample = this.getSample(track, number);
    return sample;
  }

  /* Called by the application to release the resources associated to samples already forwarded to the application */
  releaseUsedSamples(id: number, sampleNum: number) {
    let size = 0;
    const trak = this.getTrackById(id);
    if (!trak.lastValidSample) trak.lastValidSample = 0;
    for (let i = trak.lastValidSample; i < sampleNum; i++) {
      size += this.releaseSample(trak, i);
    }
    Log.info(
      'ISOFile',
      'Track #' +
        id +
        ' released samples up to ' +
        sampleNum +
        ' (released size: ' +
        size +
        ', remaining: ' +
        this.samplesDataSize +
        ')',
    );
    trak.lastValidSample = sampleNum;
  }

  start() {
    this.sampleProcessingStarted = true;
    this.processSamples(false);
  }

  stop() {
    this.sampleProcessingStarted = false;
  }

  /* Called by the application to flush the remaining samples (e.g. once the download is finished or when no more samples will be added) */
  flush() {
    Log.info('ISOFile', 'Flushing remaining samples');
    this.updateSampleLists();
    this.processSamples(true);
    this.stream.cleanBuffers();
    this.stream.logBufferLevel(true);
  }

  /* Finds the byte offset for a given time on a given track
     also returns the time of the previous rap */
  seekTrack(time: number, useRap: boolean, trak: trakBox) {
    let rap_seek_sample_num = 0;
    let seek_sample_num = 0;
    let timescale: number;

    if (trak.samples.length === 0) {
      Log.info(
        'ISOFile',
        'No sample in track, cannot seek! Using time ' +
          Log.getDurationString(0, 1) +
          ' and offset: ' +
          0,
      );
      return { offset: 0, time: 0 };
    }

    for (let j = 0; j < trak.samples.length; j++) {
      const sample = trak.samples[j];
      if (j === 0) {
        seek_sample_num = 0;
        timescale = sample.timescale;
      } else if (sample.cts > time * sample.timescale) {
        seek_sample_num = j - 1;
        break;
      }
      if (useRap && sample.is_sync) {
        rap_seek_sample_num = j;
      }
    }
    if (useRap) {
      seek_sample_num = rap_seek_sample_num;
    }
    time = trak.samples[seek_sample_num].cts;
    trak.nextSample = seek_sample_num;
    while (trak.samples[seek_sample_num].alreadyRead === trak.samples[seek_sample_num].size) {
      // No remaining samples to look for, all are downloaded.
      if (!trak.samples[seek_sample_num + 1]) {
        break;
      }
      seek_sample_num++;
    }
    const seek_offset =
      trak.samples[seek_sample_num].offset + trak.samples[seek_sample_num].alreadyRead;
    Log.info(
      'ISOFile',
      'Seeking to ' +
        (useRap ? 'RAP' : '') +
        ' sample #' +
        trak.nextSample +
        ' on track ' +
        trak.tkhd.track_id +
        ', time ' +
        Log.getDurationString(time, timescale) +
        ' and offset: ' +
        seek_offset,
    );
    return { offset: seek_offset, time: time / timescale };
  }

  getTrackDuration(trak: trakBox) {
    if (!trak.samples) {
      return Infinity;
    }

    const sample = trak.samples[trak.samples.length - 1];
    return (sample.cts + sample.duration) / sample.timescale;
  }

  /* Finds the byte offset in the file corresponding to the given time or to the time of the previous RAP */
  seek(time: number, useRap: boolean) {
    const moov = this.moov;
    let seek_info = { offset: Infinity, time: Infinity };
    if (!this.moov) {
      throw new Error('Cannot seek: moov not received!');
    } else {
      for (let i = 0; i < moov.traks.length; i++) {
        const trak = moov.traks[i];
        if (time > this.getTrackDuration(trak)) {
          // skip tracks that already ended
          continue;
        }
        const trak_seek_info = this.seekTrack(time, useRap, trak);
        if (trak_seek_info.offset < seek_info.offset) {
          seek_info.offset = trak_seek_info.offset;
        }
        if (trak_seek_info.time < seek_info.time) {
          seek_info.time = trak_seek_info.time;
        }
      }
      Log.info(
        'ISOFile',
        'Seeking at time ' +
          Log.getDurationString(seek_info.time, 1) +
          ' needs a buffer with a fileStart position of ' +
          seek_info.offset,
      );
      if (seek_info.offset === Infinity) {
        /* No sample info, in all tracks, cannot seek */
        seek_info = { offset: this.nextParsePosition, time: 0 };
      } else {
        /* check if the seek position is already in some buffer and
         in that case return the end of that buffer (or of the last contiguous buffer) */
        /* TODO: Should wait until append operations are done */
        seek_info.offset = this.stream.getEndFilePositionAfter(seek_info.offset);
      }
      Log.info(
        'ISOFile',
        'Adjusted seek position (after checking data already in buffer): ' + seek_info.offset,
      );
      return seek_info;
    }
  }

  equal(b: { boxes: Array<Box> }) {
    let box_index = 0;
    while (box_index < this.boxes.length && box_index < b.boxes.length) {
      const a_box = this.boxes[box_index];
      const b_box = b.boxes[box_index];
      if (!boxEqual(a_box, b_box)) {
        return false;
      }
      box_index++;
    }
    return true;
  }

  /**
   * Rewrite the entire file
   * @bundle isofile-write.js
   */
  write(outstream: DataStream) {
    for (let i = 0; i < this.boxes.length; i++) {
      this.boxes[i].write(outstream);
    }
  }

  /** @bundle isofile-write.js */
  createFragment(
    track_id: number,
    sampleStart: number,
    sampleEnd: number,
    existingStream: DataStream,
  ) {
    // Check existence of all samples
    const samples: Array<Sample> = [];
    for (let i = sampleStart; i <= sampleEnd; i++) {
      const trak = this.getTrackById(track_id);
      const sample = this.getSample(trak, i);
      if (!sample) {
        this.setNextSeekPositionFromSample(trak.samples[i]);
        return;
      }
      samples.push(sample);
    }

    const stream = existingStream || new DataStream();

    const moof = this.createMoof(samples);
    moof.write(stream);

    /* adjusting the data_offset now that the moof size is known*/
    moof.trafs[0].truns[0].data_offset = moof.size + 8; //8 is mdat header
    Log.debug(
      'MP4Box',
      'Adjusting data_offset with new value ' + moof.trafs[0].truns[0].data_offset,
    );
    stream.adjustUint32(
      moof.trafs[0].truns[0].data_offset_position,
      moof.trafs[0].truns[0].data_offset,
    );

    const mdat = new mdatBox();
    mdat.stream = new MultiBufferStream();
    let offset = 0;
    for (const sample of samples) {
      if (sample.data) {
        const mp4Buffer = MP4BoxBuffer.fromArrayBuffer(sample.data.buffer, offset);
        mdat.stream.insertBuffer(mp4Buffer);
        offset += sample.data.byteLength;
      }
    }
    mdat.write(stream);
    return stream;
  }

  /**
   * Modify the file and create the initialization segment
   * @bundle isofile-write.js
   */
  static writeInitializationSegment(ftyp: ftypBox, moov: moovBox, total_duration: number) {
    Log.debug('ISOFile', 'Generating initialization segment');

    const stream = new DataStream();
    ftyp.write(stream);

    /* we can now create the new mvex box */
    const mvex = moov.addBox(new mvexBox());
    if (total_duration) {
      const mehd = mvex.addBox(new mehdBox());
      mehd.fragment_duration = total_duration;
    }

    // Add trex boxes for each track
    for (let i = 0; i < moov.traks.length; i++) {
      const trex = mvex.addBox(new trexBox());
      trex.track_id = moov.traks[i].tkhd.track_id;
      trex.default_sample_description_index = 1;
      trex.default_sample_duration = moov.traks[i].samples[0]?.duration ?? 0;
      trex.default_sample_size = 0;
      trex.default_sample_flags = 1 << 16;
    }
    moov.write(stream);

    return stream.buffer;
  }

  /** @bundle isofile-write.js */
  save(name: string) {
    const stream = new DataStream();
    stream.isofile = this;
    this.write(stream);
    return stream.save(name);
  }

  /** @bundle isofile-write.js */
  getBuffer() {
    const stream = new DataStream();
    stream.isofile = this;
    this.write(stream);
    return stream;
  }

  /** @bundle isofile-write.js */
  initializeSegmentation() {
    if (!this.onSegment) {
      Log.warn('MP4Box', 'No segmentation callback set!');
    }
    if (!this.isFragmentationInitialized) {
      this.isFragmentationInitialized = true;
      this.resetTables();
    }

    // Create the moov that will hold all the tracks
    const moov = new moovBox();
    moov.addBox(this.moov.mvhd);

    // Add the tracks we want to fragment
    for (let i = 0; i < this.fragmentedTracks.length; i++) {
      const trak = this.getTrackById(this.fragmentedTracks[i].id);
      if (!trak) {
        Log.warn(
          'ISOFile',
          `Track with id ${this.fragmentedTracks[i].id} not found, skipping fragmentation initialization`,
        );
        continue;
      }
      moov.addBox(trak);
    }

    return {
      tracks: moov.traks.map((trak, i) => ({
        id: trak.tkhd.track_id,
        user: this.fragmentedTracks[i].user,
      })),
      buffer: ISOFile.writeInitializationSegment(
        this.ftyp,
        moov,
        this.moov?.mvex?.mehd.fragment_duration,
      ),
    };
  }

  /**
   * Index of the last moof box received
   * @bundle isofile-sample-processing.js
   */
  lastMoofIndex = 0;

  /**
   * size of the buffers allocated for samples
   * @bundle isofile-sample-processing.js
   */
  samplesDataSize = 0;

  /**
   * Resets all sample tables
   * @bundle isofile-sample-processing.js
   */
  resetTables() {
    this.initial_duration = this.moov.mvhd.duration;
    this.moov.mvhd.duration = 0;
    for (let i = 0; i < this.moov.traks.length; i++) {
      const trak = this.moov.traks[i];
      trak.tkhd.duration = 0;
      trak.mdia.mdhd.duration = 0;
      const stco = trak.mdia.minf.stbl.stco || trak.mdia.minf.stbl.co64;
      stco.chunk_offsets = [];
      const stsc = trak.mdia.minf.stbl.stsc;
      stsc.first_chunk = [];
      stsc.samples_per_chunk = [];
      stsc.sample_description_index = [];
      const stsz = trak.mdia.minf.stbl.stsz || trak.mdia.minf.stbl.stz2;
      stsz.sample_sizes = [];
      const stts = trak.mdia.minf.stbl.stts;
      stts.sample_counts = [];
      stts.sample_deltas = [];
      const ctts = trak.mdia.minf.stbl.ctts;
      if (ctts) {
        ctts.sample_counts = [];
        ctts.sample_offsets = [];
      }
      const stss = trak.mdia.minf.stbl.stss;
      const k = trak.mdia.minf.stbl.boxes.indexOf(stss);
      if (k !== -1) trak.mdia.minf.stbl.boxes[k] = undefined;
    }
  }

  /** @bundle isofile-sample-processing.js */
  static initSampleGroups(
    trak: trakBox,
    traf: trafBox | undefined,
    sbgps: Array<sbgpBox>,
    trak_sgpds: Array<sgpdBox>,
    traf_sgpds?: Array<sgpdBox>,
  ) {
    if (traf) {
      traf.sample_groups_info = [];
    }
    if (!trak.sample_groups_info) {
      trak.sample_groups_info = [];
    }
    for (let k = 0; k < sbgps.length; k++) {
      const sample_group_key = sbgps[k].grouping_type + '/' + sbgps[k].grouping_type_parameter;
      const sample_group_info = new SampleGroupInfo(
        sbgps[k].grouping_type,
        sbgps[k].grouping_type_parameter,
        sbgps[k],
      );
      if (traf) {
        traf.sample_groups_info[sample_group_key] = sample_group_info;
      }
      if (!trak.sample_groups_info[sample_group_key]) {
        trak.sample_groups_info[sample_group_key] = sample_group_info;
      }
      for (let l = 0; l < trak_sgpds.length; l++) {
        if (trak_sgpds[l].grouping_type === sbgps[k].grouping_type) {
          sample_group_info.description = trak_sgpds[l] as Description;
          sample_group_info.description.used = true;
        }
      }
      if (traf_sgpds) {
        for (let l = 0; l < traf_sgpds.length; l++) {
          if (traf_sgpds[l].grouping_type === sbgps[k].grouping_type) {
            sample_group_info.fragment_description = traf_sgpds[l] as Description;
            sample_group_info.fragment_description.used = true;
            sample_group_info.is_fragment = true;
          }
        }
      }
    }
    if (!traf) {
      for (let k = 0; k < trak_sgpds.length; k++) {
        if (!trak_sgpds[k].used && trak_sgpds[k].version >= 2) {
          const sample_group_key = trak_sgpds[k].grouping_type + '/0';
          const sample_group_info = new SampleGroupInfo(trak_sgpds[k].grouping_type, 0);
          if (!trak.sample_groups_info[sample_group_key]) {
            trak.sample_groups_info[sample_group_key] = sample_group_info;
          }
        }
      }
    } else {
      if (traf_sgpds) {
        for (let k = 0; k < traf_sgpds.length; k++) {
          if (!traf_sgpds[k].used && traf_sgpds[k].version >= 2) {
            const sample_group_key = traf_sgpds[k].grouping_type + '/0';
            const sample_group_info = new SampleGroupInfo(traf_sgpds[k].grouping_type, 0);
            sample_group_info.is_fragment = true;
            if (!traf.sample_groups_info[sample_group_key]) {
              traf.sample_groups_info[sample_group_key] = sample_group_info;
            }
          }
        }
      }
    }
  }

  /** @bundle isofile-sample-processing.js */
  static setSampleGroupProperties(
    trak: trakBox,
    sample: Sample,
    sample_number: number,
    sample_groups_info: Array<SampleGroupInfo>,
  ) {
    sample.sample_groups = [];
    for (const k in sample_groups_info) {
      sample.sample_groups[k] = {
        grouping_type: sample_groups_info[k].grouping_type,
        grouping_type_parameter: sample_groups_info[k].grouping_type_parameter,
      };
      if (sample_number >= sample_groups_info[k].last_sample_in_run) {
        if (sample_groups_info[k].last_sample_in_run < 0) {
          sample_groups_info[k].last_sample_in_run = 0;
        }
        sample_groups_info[k].entry_index++;
        if (sample_groups_info[k].entry_index <= sample_groups_info[k].sbgp.entries.length - 1) {
          sample_groups_info[k].last_sample_in_run +=
            sample_groups_info[k].sbgp.entries[sample_groups_info[k].entry_index].sample_count;
        }
      }
      if (sample_groups_info[k].entry_index <= sample_groups_info[k].sbgp.entries.length - 1) {
        sample.sample_groups[k].group_description_index =
          sample_groups_info[k].sbgp.entries[
            sample_groups_info[k].entry_index
          ].group_description_index;
      } else {
        sample.sample_groups[k].group_description_index = -1; // special value for not defined
      }
      if (sample.sample_groups[k].group_description_index !== 0) {
        let description: Description;
        if (sample_groups_info[k].fragment_description) {
          description = sample_groups_info[k].fragment_description;
        } else {
          description = sample_groups_info[k].description;
        }
        if (sample.sample_groups[k].group_description_index > 0) {
          let index: number;
          if (sample.sample_groups[k].group_description_index > 65535) {
            index = (sample.sample_groups[k].group_description_index >> 16) - 1;
          } else {
            index = sample.sample_groups[k].group_description_index - 1;
          }
          if (description && index >= 0) {
            sample.sample_groups[k].description = description.entries[index];
          }
        } else {
          if (description && description.version >= 2) {
            if (description.default_group_description_index > 0) {
              sample.sample_groups[k].description =
                description.entries[description.default_group_description_index - 1];
            }
          }
        }
      }
    }
  }

  /** @bundle isofile-sample-processing.js */
  static process_sdtp(sdtp: sdtpBox, sample: Sample, number: number) {
    if (!sample) {
      return;
    }
    if (sdtp) {
      sample.is_leading = sdtp.is_leading[number];
      sample.depends_on = sdtp.sample_depends_on[number];
      sample.is_depended_on = sdtp.sample_is_depended_on[number];
      sample.has_redundancy = sdtp.sample_has_redundancy[number];
    } else {
      sample.is_leading = 0;
      sample.depends_on = 0;
      sample.is_depended_on = 0;
      sample.has_redundancy = 0;
    }
  }

  /* Build initial sample list from  sample tables */
  buildSampleLists() {
    for (let i = 0; i < this.moov.traks.length; i++) {
      this.buildTrakSampleLists(this.moov.traks[i]);
    }
  }

  buildTrakSampleLists(trak: trakBox) {
    let j: number;
    let chunk_run_index: number;
    let chunk_index: number;
    let last_chunk_in_run: number;
    let offset_in_chunk: number;
    let last_sample_in_chunk: number;

    trak.samples = [];
    trak.samples_duration = 0;
    trak.samples_size = 0;

    const stco = trak.mdia.minf.stbl.stco || trak.mdia.minf.stbl.co64;
    const stsc = trak.mdia.minf.stbl.stsc;
    const stsz = trak.mdia.minf.stbl.stsz || trak.mdia.minf.stbl.stz2;
    const stts = trak.mdia.minf.stbl.stts;
    const ctts = trak.mdia.minf.stbl.ctts;
    const stss = trak.mdia.minf.stbl.stss;
    const stsd = trak.mdia.minf.stbl.stsd;
    const subs = trak.mdia.minf.stbl.subs;
    const stdp = trak.mdia.minf.stbl.stdp;
    const sbgps = trak.mdia.minf.stbl.sbgps;
    const sgpds = trak.mdia.minf.stbl.sgpds;

    let last_sample_in_stts_run = -1;
    let stts_run_index = -1;
    let last_sample_in_ctts_run = -1;
    let ctts_run_index = -1;
    let last_stss_index = 0;
    let subs_entry_index = 0;
    let last_subs_sample_index = 0;

    ISOFile.initSampleGroups(trak, undefined, sbgps, sgpds);

    if (typeof stsz === 'undefined') {
      return;
    }

    /* we build the samples one by one and compute their properties */
    for (j = 0; j < stsz.sample_sizes.length; j++) {
      const sample = {
        number: j,
        track_id: trak.tkhd.track_id,
        timescale: trak.mdia.mdhd.timescale,
        alreadyRead: 0,
        size: stsz.sample_sizes[j],
      } as Sample;

      trak.samples[j] = sample;
      /* size can be known directly */
      trak.samples_size += sample.size;
      /* computing chunk-based properties (offset, sample description index)*/
      if (j === 0) {
        chunk_index = 1; /* the first sample is in the first chunk (chunk indexes are 1-based) */
        chunk_run_index = 0; /* the first chunk is the first entry in the first_chunk table */
        sample.chunk_index = chunk_index;
        sample.chunk_run_index = chunk_run_index;
        last_sample_in_chunk = stsc.samples_per_chunk[chunk_run_index];
        offset_in_chunk = 0;

        /* Is there another entry in the first_chunk table ? */
        if (chunk_run_index + 1 < stsc.first_chunk.length) {
          /* The last chunk in the run is the chunk before the next first chunk */
          last_chunk_in_run = stsc.first_chunk[chunk_run_index + 1] - 1;
        } else {
          /* There is only one entry in the table, it is valid for all future chunks*/
          last_chunk_in_run = Infinity;
        }
      } else {
        if (j < last_sample_in_chunk) {
          /* the sample is still in the current chunk */
          sample.chunk_index = chunk_index;
          sample.chunk_run_index = chunk_run_index;
        } else {
          /* the sample is in the next chunk */
          chunk_index++;
          sample.chunk_index = chunk_index;
          /* reset the accumulated offset in the chunk */
          offset_in_chunk = 0;
          if (chunk_index <= last_chunk_in_run) {
            /* stay in the same entry of the first_chunk table */
            /* chunk_run_index unmodified */
          } else {
            chunk_run_index++;
            /* Is there another entry in the first_chunk table ? */
            if (chunk_run_index + 1 < stsc.first_chunk.length) {
              /* The last chunk in the run is the chunk before the next first chunk */
              last_chunk_in_run = stsc.first_chunk[chunk_run_index + 1] - 1;
            } else {
              /* There is only one entry in the table, it is valid for all future chunks*/
              last_chunk_in_run = Infinity;
            }
          }
          sample.chunk_run_index = chunk_run_index;
          last_sample_in_chunk += stsc.samples_per_chunk[chunk_run_index];
        }
      }

      sample.description_index = stsc.sample_description_index[sample.chunk_run_index] - 1;
      sample.description = stsd.entries[sample.description_index];
      sample.offset =
        stco.chunk_offsets[sample.chunk_index - 1] +
        offset_in_chunk; /* chunk indexes are 1-based */
      offset_in_chunk += sample.size;

      /* setting dts, cts, duration and rap flags */
      if (j > last_sample_in_stts_run) {
        stts_run_index++;
        if (last_sample_in_stts_run < 0) {
          last_sample_in_stts_run = 0;
        }
        last_sample_in_stts_run += stts.sample_counts[stts_run_index];
      }
      if (j > 0) {
        trak.samples[j - 1].duration = stts.sample_deltas[stts_run_index];
        trak.samples_duration += trak.samples[j - 1].duration;
        sample.dts = trak.samples[j - 1].dts + trak.samples[j - 1].duration;
      } else {
        sample.dts = 0;
      }
      if (ctts) {
        if (j >= last_sample_in_ctts_run) {
          ctts_run_index++;
          if (last_sample_in_ctts_run < 0) {
            last_sample_in_ctts_run = 0;
          }
          last_sample_in_ctts_run += ctts.sample_counts[ctts_run_index];
        }
        sample.cts = trak.samples[j].dts + ctts.sample_offsets[ctts_run_index];
      } else {
        sample.cts = sample.dts;
      }
      if (stss) {
        if (j === stss.sample_numbers[last_stss_index] - 1) {
          // sample numbers are 1-based
          sample.is_sync = true;
          last_stss_index++;
        } else {
          sample.is_sync = false;
          sample.degradation_priority = 0;
        }
        if (subs) {
          if (subs.entries[subs_entry_index].sample_delta + last_subs_sample_index === j + 1) {
            sample.subsamples = subs.entries[subs_entry_index].subsamples;
            last_subs_sample_index += subs.entries[subs_entry_index].sample_delta;
            subs_entry_index++;
          }
        }
      } else {
        sample.is_sync = true;
      }
      ISOFile.process_sdtp(trak.mdia.minf.stbl.sdtp, sample, sample.number);
      if (stdp) {
        sample.degradation_priority = stdp.priority[j];
      } else {
        sample.degradation_priority = 0;
      }
      if (subs) {
        if (subs.entries[subs_entry_index].sample_delta + last_subs_sample_index === j) {
          sample.subsamples = subs.entries[subs_entry_index].subsamples;
          last_subs_sample_index += subs.entries[subs_entry_index].sample_delta;
        }
      }
      if (sbgps.length > 0 || sgpds.length > 0) {
        ISOFile.setSampleGroupProperties(trak, sample, j, trak.sample_groups_info);
      }
    }
    if (j > 0) {
      trak.samples[j - 1].duration = Math.max(trak.mdia.mdhd.duration - trak.samples[j - 1].dts, 0);
      trak.samples_duration += trak.samples[j - 1].duration;
    }
  }

  /**
   * Update sample list when new 'moof' boxes are received
   * @bundle isofile-sample-processing.js
   */
  updateSampleLists() {
    let default_sample_description_index: number;
    let default_sample_duration: number;
    let default_sample_size: number;
    let default_sample_flags: number;
    let last_run_position: number;

    if (this.moov === undefined) {
      return;
    }

    /* if the input file is fragmented and fetched in multiple downloads, we need to update the list of samples */
    while (this.lastMoofIndex < this.moofs.length) {
      const box = this.moofs[this.lastMoofIndex];
      this.lastMoofIndex++;
      if (box.type === 'moof') {
        const moof = box;
        for (let i = 0; i < moof.trafs.length; i++) {
          const traf = moof.trafs[i];
          const trak = this.getTrackById(traf.tfhd.track_id);
          const trex = this.getTrexById(traf.tfhd.track_id);
          if (traf.tfhd.flags & TFHD_FLAG_SAMPLE_DESC) {
            default_sample_description_index = traf.tfhd.default_sample_description_index;
          } else {
            default_sample_description_index = trex ? trex.default_sample_description_index : 1;
          }
          if (traf.tfhd.flags & TFHD_FLAG_SAMPLE_DUR) {
            default_sample_duration = traf.tfhd.default_sample_duration;
          } else {
            default_sample_duration = trex ? trex.default_sample_duration : 0;
          }
          if (traf.tfhd.flags & TFHD_FLAG_SAMPLE_SIZE) {
            default_sample_size = traf.tfhd.default_sample_size;
          } else {
            default_sample_size = trex ? trex.default_sample_size : 0;
          }
          if (traf.tfhd.flags & TFHD_FLAG_SAMPLE_FLAGS) {
            default_sample_flags = traf.tfhd.default_sample_flags;
          } else {
            default_sample_flags = trex ? trex.default_sample_flags : 0;
          }
          traf.sample_number = 0;
          /* process sample groups */
          if (traf.sbgps.length > 0) {
            ISOFile.initSampleGroups(trak, traf, traf.sbgps, trak.mdia.minf.stbl.sgpds, traf.sgpds);
          }
          for (let j = 0; j < traf.truns.length; j++) {
            const trun = traf.truns[j];
            for (let k = 0; k < trun.sample_count; k++) {
              const description_index = default_sample_description_index - 1;

              let sample_flags = default_sample_flags;
              if (trun.flags & TRUN_FLAGS_FLAGS) {
                sample_flags = trun.sample_flags[k];
              } else if (k === 0 && trun.flags & TRUN_FLAGS_FIRST_FLAG) {
                sample_flags = trun.first_sample_flags;
              }

              let size = default_sample_size;
              if (trun.flags & TRUN_FLAGS_SIZE) {
                size = trun.sample_size[k];
              }
              trak.samples_size += size;

              let duration = default_sample_duration;
              if (trun.flags & TRUN_FLAGS_DURATION) {
                duration = trun.sample_duration[k];
              }
              trak.samples_duration += duration;

              let dts: number;
              if (trak.first_traf_merged || k > 0) {
                dts =
                  trak.samples[trak.samples.length - 1].dts +
                  trak.samples[trak.samples.length - 1].duration;
              } else {
                if (traf.tfdt) {
                  dts = traf.tfdt.baseMediaDecodeTime;
                } else {
                  dts = 0;
                }
                trak.first_traf_merged = true;
              }

              let cts = dts;
              if (trun.flags & TRUN_FLAGS_CTS_OFFSET) {
                cts = dts + trun.sample_composition_time_offset[k];
              }

              //ISOFile.process_sdtp(traf.sdtp, sample, sample.number_in_traf);
              const bdop = traf.tfhd.flags & TFHD_FLAG_BASE_DATA_OFFSET ? true : false;
              const dbim = traf.tfhd.flags & TFHD_FLAG_DEFAULT_BASE_IS_MOOF ? true : false;
              const dop = trun.flags & TRUN_FLAGS_DATA_OFFSET ? true : false;
              let bdo = 0;
              if (!bdop) {
                if (!dbim) {
                  if (j === 0) {
                    // the first track in the movie fragment
                    bdo = moof.start; // the position of the first byte of the enclosing Movie Fragment Box
                  } else {
                    bdo = last_run_position; // end of the data defined by the preceding *track* (irrespective of the track id) fragment in the moof
                  }
                } else {
                  bdo = moof.start;
                }
              } else {
                bdo = traf.tfhd.base_data_offset;
              }

              let offset: number;
              if (j === 0 && k === 0) {
                if (dop) {
                  offset = bdo + trun.data_offset; // If the data-offset is present, it is relative to the base-data-offset established in the track fragment header
                } else {
                  offset = bdo; // the data for this run starts the base-data-offset defined by the track fragment header
                }
              } else {
                offset = last_run_position; // this run starts immediately after the data of the previous run
              }
              last_run_position = offset + size;

              const number_in_traf = traf.sample_number;
              traf.sample_number++;

              const sample: Sample = {
                cts,
                description_index,
                description: trak.mdia.minf.stbl.stsd.entries[description_index],
                dts,
                duration,
                moof_number: this.lastMoofIndex,
                number_in_traf,
                number: trak.samples.length,
                offset,
                size,
                timescale: trak.mdia.mdhd.timescale,
                track_id: trak.tkhd.track_id,
                is_sync: (sample_flags >> 16) & 0x1 ? false : true,
                is_leading: (sample_flags >> 26) & 0x3,
                depends_on: (sample_flags >> 24) & 0x3,
                is_depended_on: (sample_flags >> 22) & 0x3,
                has_redundancy: (sample_flags >> 20) & 0x3,
                degradation_priority: sample_flags & 0xffff,
              };

              traf.first_sample_index = trak.samples.length;
              trak.samples.push(sample);

              if (
                traf.sbgps.length > 0 ||
                traf.sgpds.length > 0 ||
                trak.mdia.minf.stbl.sbgps.length > 0 ||
                trak.mdia.minf.stbl.sgpds.length > 0
              ) {
                ISOFile.setSampleGroupProperties(
                  trak,
                  sample,
                  sample.number_in_traf,
                  traf.sample_groups_info,
                );
              }
            }
          }
          if (traf.subs) {
            trak.has_fragment_subsamples = true;
            let sample_index = traf.first_sample_index;
            for (let j = 0; j < traf.subs.entries.length; j++) {
              sample_index += traf.subs.entries[j].sample_delta;
              const sample = trak.samples[sample_index - 1];
              sample.subsamples = traf.subs.entries[j].subsamples;
            }
          }
        }
      }
    }
  }

  /**
   * Try to get sample data for a given sample:
   * returns null if not found
   * returns the same sample if already requested
   *
   * @bundle isofile-sample-processing.js
   */
  getSample(trak: trakBox, sampleNum: number) {
    const sample = trak.samples[sampleNum];

    if (!this.moov) return;

    if (!sample.data) {
      /* Not yet fetched */
      sample.data = new Uint8Array(sample.size);
      sample.alreadyRead = 0;
      this.samplesDataSize += sample.size;
      Log.debug(
        'ISOFile',
        'Allocating sample #' +
          sampleNum +
          ' on track #' +
          trak.tkhd.track_id +
          ' of size ' +
          sample.size +
          ' (total: ' +
          this.samplesDataSize +
          ')',
      );
    } else if (sample.alreadyRead === sample.size) {
      /* Already fetched entirely */
      return sample;
    }

    /* The sample has only been partially fetched, we need to check in all buffers */
    while (true) {
      let stream = this.stream;
      let index = stream.findPosition(true, sample.offset + sample.alreadyRead, false);
      let buffer: MP4BoxBuffer;
      let fileStart: number;
      if (index > -1) {
        // We haven't yet transferred the sample data to mdat
        buffer = stream.buffers[index];
        fileStart = buffer.fileStart;
      } else {
        // We might have already transferred the sample data to mdat
        for (const mdat of this.mdats) {
          if (!mdat.stream) {
            Log.debug(
              'ISOFile',
              'mdat stream not yet fully read for #' + this.mdats.indexOf(mdat) + ' mdat',
            );
            continue; // mdat stream not yet fully read
          }
          index = mdat.stream.findPosition(
            true,
            sample.offset + sample.alreadyRead - mdat.start - mdat.hdr_size,
            false,
          );
          if (index > -1) {
            stream = mdat.stream;
            buffer = mdat.stream.buffers[index];
            fileStart = mdat.start + mdat.hdr_size + buffer.fileStart;
            break;
          }
        }
      }

      if (buffer) {
        const lengthAfterStart =
          buffer.byteLength - (sample.offset + sample.alreadyRead - fileStart);
        if (sample.size - sample.alreadyRead <= lengthAfterStart) {
          /* the (rest of the) sample is entirely contained in this buffer */

          Log.debug(
            'ISOFile',
            'Getting sample #' +
              sampleNum +
              ' data (alreadyRead: ' +
              sample.alreadyRead +
              ' offset: ' +
              (sample.offset + sample.alreadyRead - fileStart) +
              ' read size: ' +
              (sample.size - sample.alreadyRead) +
              ' full size: ' +
              sample.size +
              ')',
          );

          DataStream.memcpy(
            sample.data.buffer,
            sample.alreadyRead,
            buffer,
            sample.offset + sample.alreadyRead - fileStart,
            sample.size - sample.alreadyRead,
          );

          /* update the number of bytes used in this buffer and check if it needs to be removed */
          buffer.usedBytes += sample.size - sample.alreadyRead;
          stream.logBufferLevel();

          sample.alreadyRead = sample.size;

          return sample;
        } else {
          /* the sample does not end in this buffer */

          if (lengthAfterStart === 0) return;

          Log.debug(
            'ISOFile',
            'Getting sample #' +
              sampleNum +
              ' partial data (alreadyRead: ' +
              sample.alreadyRead +
              ' offset: ' +
              (sample.offset + sample.alreadyRead - fileStart) +
              ' read size: ' +
              lengthAfterStart +
              ' full size: ' +
              sample.size +
              ')',
          );

          // NOTE:  this was an error before
          //        it used to be DataStream.memcpy({...})
          DataStream.memcpy(
            sample.data.buffer,
            sample.alreadyRead,
            buffer,
            sample.offset + sample.alreadyRead - fileStart,
            lengthAfterStart,
          );
          sample.alreadyRead += lengthAfterStart;

          /* update the number of bytes used in this buffer and check if it needs to be removed */
          buffer.usedBytes += lengthAfterStart;
          stream.logBufferLevel();

          /* keep looking in the next buffer */
        }
      } else return;
    }
  }

  /**
   * Release the memory used to store the data of the sample
   *
   * @bundle isofile-sample-processing.js
   */
  releaseSample(trak: trakBox, sampleNum: number) {
    const sample = trak.samples[sampleNum];
    if (sample.data) {
      this.samplesDataSize -= sample.size;
      sample.data = undefined;
      sample.alreadyRead = 0;
      return sample.size;
    } else {
      return 0;
    }
  }

  /** @bundle isofile-sample-processing.js */
  getAllocatedSampleDataSize() {
    return this.samplesDataSize;
  }

  /**
   * Builds the MIME Type 'codecs' sub-parameters for the whole file
   *
   * @bundle isofile-sample-processing.js
   */
  getCodecs() {
    let codecs = '';
    for (let i = 0; i < this.moov.traks.length; i++) {
      const trak = this.moov.traks[i];
      if (i > 0) {
        codecs += ',';
      }
      codecs += trak.mdia.minf.stbl.stsd.entries[0].getCodec();
    }
    return codecs;
  }

  /**
   * Helper function
   *
   * @bundle isofile-sample-processing.js
   */
  getTrexById(id: number) {
    if (!this.moov || !this.moov.mvex) return;
    for (let i = 0; i < this.moov.mvex.trexs.length; i++) {
      const trex = this.moov.mvex.trexs[i];
      if (trex.track_id === id) return trex;
    }
  }

  /**
   * Helper function
   *
   * @bundle isofile-sample-processing.js
   */
  getTrackById(id: number): trakBox {
    if (!this.moov) return;
    for (let j = 0; j < this.moov.traks.length; j++) {
      const trak = this.moov.traks[j];
      if (trak.tkhd.track_id === id) return trak;
    }
  }

  /** @bundle isofile-item-processing.js */
  flattenItemInfo() {
    const items = this.items;
    const entity_groups = this.entity_groups;
    const meta = this.meta;
    if (!meta || !meta.hdlr || !meta.iinf) return;
    for (let i = 0; i < meta.iinf.item_infos.length; i++) {
      const id = meta.iinf.item_infos[i].item_ID;
      items[id] = {
        id,
        name: meta.iinf.item_infos[i].item_name,
        ref_to: [],
        content_type: meta.iinf.item_infos[i].content_type,
        content_encoding: meta.iinf.item_infos[i].content_encoding,
        item_uri_type: meta.iinf.item_infos[i].item_uri_type,
        type: meta.iinf.item_infos[i].item_type ? meta.iinf.item_infos[i].item_type : 'mime',
        protection:
          // NOTE:   This was `meta.iinf.item_infos[i].protection_index` before
          meta.iinf.item_infos[i].item_protection_index > 0
            ? // NOTE:   This was `meta.iinf.item_infos[i].protection_index - 1` before
              meta.ipro.protections[meta.iinf.item_infos[i].item_protection_index - 1]
            : undefined,
      };
    }
    if (meta.grpl) {
      for (let i = 0; i < meta.grpl.boxes.length; i++) {
        const entityGroup = meta.grpl.boxes[i];
        entity_groups[entityGroup.group_id] = {
          id: entityGroup.group_id,
          entity_ids: entityGroup.entity_ids,
          type: entityGroup.type,
        };
      }
    }
    if (meta.iloc) {
      for (let i = 0; i < meta.iloc.items.length; i++) {
        const itemloc = meta.iloc.items[i];
        const item = items[itemloc.item_ID];
        if (itemloc.data_reference_index !== 0) {
          Log.warn('Item storage with reference to other files: not supported');
          item.source = meta.dinf.boxes[itemloc.data_reference_index - 1];
        }
        item.extents = [];
        item.size = 0;
        for (let j = 0; j < itemloc.extents.length; j++) {
          item.extents[j] = {
            offset: itemloc.extents[j].extent_offset + itemloc.base_offset,
            length: itemloc.extents[j].extent_length,
            alreadyRead: 0,
          };
          if (itemloc.construction_method === 1) {
            item.extents[j].offset += meta.idat.start + meta.idat.hdr_size;
          }
          item.size += item.extents[j].length;
        }
      }
    }
    if (meta.pitm) {
      items[meta.pitm.item_id].primary = true;
    }
    if (meta.iref) {
      for (let i = 0; i < meta.iref.references.length; i++) {
        const ref = meta.iref.references[i];
        for (let j = 0; j < ref.references.length; j++) {
          items[ref.from_item_ID].ref_to.push({ type: ref.type, id: ref.references[j] });
        }
      }
    }
    if (meta.iprp) {
      for (let k = 0; k < meta.iprp.ipmas.length; k++) {
        const ipma = meta.iprp.ipmas[k];
        for (let i = 0; i < ipma.associations.length; i++) {
          const association = ipma.associations[i];
          const item = items[association.id] ?? entity_groups[association.id];
          if (item) {
            if (item.properties === undefined) {
              item.properties = {
                boxes: [],
              };
            }
            for (let j = 0; j < association.props.length; j++) {
              const propEntry = association.props[j];
              if (
                propEntry.property_index > 0 &&
                propEntry.property_index - 1 < meta.iprp.ipco.boxes.length
              ) {
                const propbox = meta.iprp.ipco.boxes[propEntry.property_index - 1];
                item.properties[propbox.type] = propbox;
                item.properties.boxes.push(propbox);
              }
            }
          }
        }
      }
    }
  }

  /** @bundle isofile-item-processing.js */
  getItem(item_id: number) {
    if (!this.meta) return;

    const item = this.items[item_id];
    if (!item.data && item.size) {
      /* Not yet fetched */
      item.data = new Uint8Array(item.size);
      item.alreadyRead = 0;
      this.itemsDataSize += item.size;
      Log.debug(
        'ISOFile',
        'Allocating item #' +
          item_id +
          ' of size ' +
          item.size +
          ' (total: ' +
          this.itemsDataSize +
          ')',
      );
    } else if (item.alreadyRead === item.size) {
      /* Already fetched entirely */
      return item;
    }

    /* The item has only been partially fetched, we need to check in all buffers to find the remaining extents*/

    for (let i = 0; i < item.extents.length; i++) {
      const extent = item.extents[i];
      if (extent.alreadyRead === extent.length) {
        continue;
      } else {
        const index = this.stream.findPosition(true, extent.offset + extent.alreadyRead, false);
        if (index > -1) {
          const buffer = this.stream.buffers[index];
          const lengthAfterStart =
            buffer.byteLength - (extent.offset + extent.alreadyRead - buffer.fileStart);
          if (extent.length - extent.alreadyRead <= lengthAfterStart) {
            /* the (rest of the) extent is entirely contained in this buffer */

            Log.debug(
              'ISOFile',
              'Getting item #' +
                item_id +
                ' extent #' +
                i +
                ' data (alreadyRead: ' +
                extent.alreadyRead +
                ' offset: ' +
                (extent.offset + extent.alreadyRead - buffer.fileStart) +
                ' read size: ' +
                (extent.length - extent.alreadyRead) +
                ' full extent size: ' +
                extent.length +
                ' full item size: ' +
                item.size +
                ')',
            );

            // Note: this used to be a memcpy({ ... })
            DataStream.memcpy(
              item.data.buffer,
              item.alreadyRead,
              buffer,
              extent.offset + extent.alreadyRead - buffer.fileStart,
              extent.length - extent.alreadyRead,
            );

            /* update the number of bytes used in this buffer and check if it needs to be removed */
            if (!this.parsingMdat || this.discardMdatData)
              buffer.usedBytes += extent.length - extent.alreadyRead;
            this.stream.logBufferLevel();

            item.alreadyRead += extent.length - extent.alreadyRead;
            extent.alreadyRead = extent.length;
          } else {
            /* the sample does not end in this buffer */

            Log.debug(
              'ISOFile',
              'Getting item #' +
                item_id +
                ' extent #' +
                i +
                ' partial data (alreadyRead: ' +
                extent.alreadyRead +
                ' offset: ' +
                (extent.offset + extent.alreadyRead - buffer.fileStart) +
                ' read size: ' +
                lengthAfterStart +
                ' full extent size: ' +
                extent.length +
                ' full item size: ' +
                item.size +
                ')',
            );

            // Note: this used to be a memcpy({ ... })
            DataStream.memcpy(
              item.data.buffer,
              item.alreadyRead,
              buffer,
              extent.offset + extent.alreadyRead - buffer.fileStart,
              lengthAfterStart,
            );
            extent.alreadyRead += lengthAfterStart;
            item.alreadyRead += lengthAfterStart;

            /* update the number of bytes used in this buffer and check if it needs to be removed */
            if (!this.parsingMdat || this.discardMdatData) buffer.usedBytes += lengthAfterStart;
            this.stream.logBufferLevel();
            return;
          }
        } else return;
      }
    }
    if (item.alreadyRead === item.size) {
      /* fetched entirely */
      return item;
    }
  }

  /**
   * Release the memory used to store the data of the item
   *
   * @bundle isofile-item-processing.js
   */
  releaseItem(item_id: number) {
    const item = this.items[item_id];
    if (item.data) {
      this.itemsDataSize -= item.size;
      item.data = undefined;
      item.alreadyRead = 0;
      for (let i = 0; i < item.extents.length; i++) {
        const extent = item.extents[i];
        extent.alreadyRead = 0;
      }
      return item.size;
    } else {
      return 0;
    }
  }

  /** @bundle isofile-item-processing.js */
  processItems(callback: (item: Item) => void) {
    for (const i in this.items) {
      const item = this.items[i];
      this.getItem(item.id);
      if (callback && !item.sent) {
        callback(item);
        item.sent = true;
        item.data = undefined;
      }
    }
  }

  /** @bundle isofile-item-processing.js */
  hasItem(name: string) {
    for (const i in this.items) {
      const item = this.items[i];
      if (item.name === name) {
        return item.id;
      }
    }
    return -1;
  }

  /** @bundle isofile-item-processing.js */
  getMetaHandler() {
    if (this.meta) return this.meta.hdlr.handler;
  }

  /** @bundle isofile-item-processing.js */
  getPrimaryItem() {
    if (this.meta && this.meta.pitm) return this.getItem(this.meta.pitm.item_id);
  }

  /** @bundle isofile-item-processing.js */
  itemToFragmentedTrackFile({ itemId }: { itemId?: number } = {}) {
    let item;
    if (itemId) {
      item = this.getItem(itemId);
    } else {
      item = this.getPrimaryItem();
    }
    if (!item) return;

    const file = new ISOFile();
    file.discardMdatData = false;
    // assuming the track type is the same as the item type
    const trackOptions: IsoFileOptions = {
      type: item.type,
      description_boxes: item.properties.boxes,
    };
    if (item.properties.ispe) {
      trackOptions.width = item.properties.ispe.image_width;
      trackOptions.height = item.properties.ispe.image_height;
    }
    const trackId = file.addTrack(trackOptions);
    if (trackId) {
      file.addSample(trackId, item.data);
      return file;
    }
  }

  /**
   * position in the current buffer of the beginning of the last box parsed
   *
   * @bundle isofile-advanced-parsing.js
   */
  lastBoxStartPosition = 0;
  /**
   * indicator if the parsing is stuck in the middle of an mdat box
   *
   * @bundle isofile-advanced-parsing.js
   */
  parsingMdat?: mdatBox;
  /* next file position that the parser needs:
   *  - 0 until the first buffer (i.e. fileStart ===0) has been received
   *  - otherwise, the next box start until the moov box has been parsed
   *  - otherwise, the position of the next sample to fetch
   * @bundle isofile-advanced-parsing.js
   */
  nextParsePosition = 0;
  /**
   * keep mdat data
   *
   * @bundle isofile-advanced-parsing.js
   */
  discardMdatData = true;

  /** @bundle isofile-advanced-parsing.js */
  processIncompleteBox(ret: IncompleteBox) {
    /* we did not have enough bytes in the current buffer to parse the entire box */
    if (ret.type === 'mdat') {
      /* we had enough bytes to get its type and size and it's an 'mdat' */

      /* special handling for mdat boxes, since we don't actually need to parse it linearly
		   we create the box */
      const box = new mdatBox(ret.size);
      this.parsingMdat = box;
      this.boxes.push(box);
      this.mdats.push(box);
      box.start = ret.start;
      box.hdr_size = ret.hdr_size;
      box.original_size = ret.original_size;
      this.stream.addUsedBytes(box.hdr_size);

      /* indicate that the parsing should start from the end of the box */
      this.lastBoxStartPosition = box.start + box.size;
      /* let's see if we have the end of the box in the other buffers */
      const found = this.stream.seek(box.start + box.size, false, this.discardMdatData);
      if (found) {
        /* we can now transfer the data to the mdat box stream */
        this.transferMdatData();
        /* found the end of the box */
        this.parsingMdat = undefined;
        /* let's see if we can parse more in this buffer */
        return true;
      } else {
        /* 'mdat' end not found in the existing buffers */
        /* determine the next position in the file to start parsing from */
        if (!this.moovStartFound) {
          /* moov not find yet,
				   the file probably has 'mdat' at the beginning, and 'moov' at the end,
				   indicate that the downloader should not try to download those bytes now */
          this.nextParsePosition = box.start + box.size;
        } else {
          /* we have the start of the moov box,
				   the next bytes should try to complete the current 'mdat' */
          this.nextParsePosition = this.stream.findEndContiguousBuf();
        }
        /* not much we can do, wait for more buffers to arrive */
        return false;
      }
    } else {
      /* box is incomplete, we may not even know its type */
      if (ret.type === 'moov') {
        /* the incomplete box is a 'moov' box */
        this.moovStartFound = true;
        if (this.mdats.length === 0) {
          this.isProgressive = true;
        }
      }
      /* either it's not an mdat box (and we need to parse it, we cannot skip it)
		   (TODO: we could skip 'free' boxes ...)
			   or we did not have enough data to parse the type and size of the box,
		   we try to concatenate the current buffer with the next buffer to restart parsing */
      const merged = this.stream.mergeNextBuffer ? this.stream.mergeNextBuffer() : false;
      if (merged) {
        /* The next buffer was contiguous, the merging succeeded,
			   we can now continue parsing,
			   the next best position to parse is at the end of this new buffer */
        this.nextParsePosition = this.stream.getEndPosition();
        return true;
      } else {
        /* we cannot concatenate existing buffers because they are not contiguous or because there is no additional buffer */
        /* The next best position to parse is still at the end of this old buffer */
        if (!ret.type) {
          /* There were not enough bytes in the buffer to parse the box type and length,
				   the next fetch should retrieve those missing bytes, i.e. the next bytes after this buffer */
          this.nextParsePosition = this.stream.getEndPosition();
        } else {
          /* we had enough bytes to parse size and type of the incomplete box
				   if we haven't found yet the moov box, skip this one and try the next one
				   if we have found the moov box, let's continue linear parsing */
          if (this.moovStartFound) {
            this.nextParsePosition = this.stream.getEndPosition();
          } else {
            this.nextParsePosition = this.stream.getPosition() + ret.size;
          }
        }
        return false;
      }
    }
  }

  /** @bundle isofile-advanced-parsing.js */
  hasIncompleteMdat() {
    return this.parsingMdat !== undefined;
  }

  /**
   * Transfer the data of the mdat box to its stream
   * @param mdat the mdat box to use
   */
  transferMdatData(inMdat?: mdatBox) {
    const mdat = inMdat ?? this.parsingMdat;
    if (this.discardMdatData) {
      Log.debug('ISOFile', "Discarding 'mdat' data, not transferring it to the mdat box stream");
      return;
    }
    if (!mdat) {
      Log.warn('ISOFile', "Cannot transfer 'mdat' data, no mdat box is being parsed");
      return;
    }

    // Start by finding the starting buffer
    const startBufferIndex = this.stream.findPosition(true, mdat.start + mdat.hdr_size, false);
    const endBufferIndex = this.stream.findPosition(true, mdat.start + mdat.size, false);

    if (startBufferIndex === -1 || endBufferIndex === -1) {
      console.trace(mdat, startBufferIndex, endBufferIndex);
      Log.warn('ISOFile', "Cannot transfer 'mdat' data, start or end buffer not found");
      return;
    }

    // Transfer the data
    mdat.stream = new MultiBufferStream();
    for (let i = startBufferIndex; i <= endBufferIndex; i++) {
      const buffer = this.stream.buffers[i];
      const startOffset =
        i === startBufferIndex ? mdat.start + mdat.hdr_size - buffer.fileStart : 0;
      const endOffset =
        i === endBufferIndex ? mdat.start + mdat.size - buffer.fileStart : buffer.byteLength;
      if (endOffset > startOffset) {
        Log.debug(
          'ISOFile',
          "Transferring 'mdat' data from buffer #" +
            i +
            ' (' +
            startOffset +
            ' to ' +
            endOffset +
            ')',
        );

        const transferSize = endOffset - startOffset;
        const newBuffer = new MP4BoxBuffer(transferSize);
        const lastPosition = mdat.stream.getAbsoluteEndPosition();
        DataStream.memcpy(newBuffer, 0, buffer, startOffset, transferSize);
        newBuffer.fileStart = lastPosition;

        // Insert the new buffer into the mdat stream
        mdat.stream.insertBuffer(newBuffer);

        // Consume the bytes in the original stream
        buffer.usedBytes += transferSize;
      }
    }
  }

  /** @bundle isofile-advanced-parsing.js */
  processIncompleteMdat() {
    /* we are in the parsing of an incomplete mdat box */
    const box = this.parsingMdat;
    const found = this.stream.seek(box.start + box.size, false, this.discardMdatData);
    if (found) {
      Log.debug('ISOFile', "Found 'mdat' end in buffered data");
      /* we can now transfer the data to the mdat box stream */
      this.transferMdatData();
      /* the end of the mdat has been found */
      this.parsingMdat = undefined;
      /* we can parse more in this buffer */
      return true;
    } else {
      /* we don't have the end of this mdat yet,
		   indicate that the next byte to fetch is the end of the buffers we have so far,
		   return and wait for more buffer to come */
      this.nextParsePosition = this.stream.findEndContiguousBuf();
      return false;
    }
  }

  /** @bundle isofile-advanced-parsing.js */
  restoreParsePosition() {
    /* Reposition at the start position of the previous box not entirely parsed */
    return this.stream.seek(this.lastBoxStartPosition, true, this.discardMdatData);
  }

  /** @bundle isofile-advanced-parsing.js */
  saveParsePosition() {
    /* remember the position of the box start in case we need to roll back (if the box is incomplete) */
    this.lastBoxStartPosition = this.stream.getPosition();
  }

  /** @bundle isofile-advanced-parsing.js */
  updateUsedBytes(box: Box, _ret: ReturnType<typeof parseOneBox>) {
    if (this.stream.addUsedBytes) {
      if (box.type === 'mdat') {
        /* for an mdat box, only its header is considered used, other bytes will be used when sample data is requested */
        this.stream.addUsedBytes(box.hdr_size);
        if (this.discardMdatData) {
          this.stream.addUsedBytes(box.size - box.hdr_size);
        }
      } else {
        /* for all other boxes, the entire box data is considered used */
        this.stream.addUsedBytes(box.size);
      }
    }
  }

  /** @bundle isofile-advanced-creation.js */
  addBox<T extends Box>(box: T): T {
    return Box.prototype.addBox.call(this, box);
  }

  /** @bundle isofile-advanced-creation.js */
  init(options: IsoFileOptions = {}) {
    const ftyp = this.addBox(new ftypBox());
    ftyp.major_brand = (options.brands && options.brands[0]) || 'iso4';
    ftyp.minor_version = 0;
    ftyp.compatible_brands = options.brands || ['iso4'];

    const moov = this.addBox(new moovBox());
    moov.addBox(new mvexBox());

    const mvhd = moov.addBox(new mvhdBox());
    mvhd.timescale = options.timescale || 600;
    mvhd.rate = options.rate || 1 << 16;
    mvhd.creation_time = 0;
    mvhd.modification_time = 0;
    mvhd.duration = options.duration || 0;
    mvhd.volume = options.width ? 0 : 0x0100;
    mvhd.matrix = [1 << 16, 0, 0, 0, 1 << 16, 0, 0, 0, 0x40000000];
    mvhd.next_track_id = 1;

    return this;
  }

  /** @bundle isofile-advanced-creation.js */
  addTrack(_options: IsoFileOptions = {}) {
    if (!this.moov) {
      this.init(_options);
    }

    const options: IsoFileOptions = _options || {};

    options.width = options.width || 320;
    options.height = options.height || 320;
    options.id = options.id || this.moov.mvhd.next_track_id;
    options.type = options.type || 'avc1';

    const trak = this.moov.addBox(new trakBox());
    this.moov.mvhd.next_track_id = options.id + 1;

    const tkhd = trak.addBox(new tkhdBox());
    tkhd.flags = TKHD_FLAG_ENABLED | TKHD_FLAG_IN_MOVIE | TKHD_FLAG_IN_PREVIEW;
    tkhd.creation_time = 0;
    tkhd.modification_time = 0;
    tkhd.track_id = options.id;
    tkhd.duration = options.duration || 0;
    tkhd.layer = options.layer || 0;
    tkhd.alternate_group = 0;
    tkhd.volume = 1;
    tkhd.matrix = [1 << 16, 0, 0, 0, 1 << 16, 0, 0, 0, 0x40000000];
    tkhd.width = options.width << 16;
    tkhd.height = options.height << 16;

    const mdia = trak.addBox(new mdiaBox());
    const mdhd = mdia.addBox(new mdhdBox());
    mdhd.creation_time = 0;
    mdhd.modification_time = 0;
    mdhd.timescale = options.timescale || 1;
    mdhd.duration = options.media_duration || 0;
    // @ts-expect-error FIXME:   some code expects language to be a number
    mdhd.language = options.language || 'und';

    const hdlr = mdia.addBox(new hdlrBox());
    hdlr.handler = options.hdlr || 'vide';
    hdlr.name = options.name || 'Track created with MP4Box.js';

    const elng = mdia.addBox(new elngBox());
    elng.extended_language = options.language || 'fr-FR';

    const minf = mdia.addBox(new minfBox());

    const sampleEntry = BoxRegistry.sampleEntry[options.type];
    if (!sampleEntry) return;

    const sample_description_entry = new sampleEntry();
    sample_description_entry.data_reference_index = 1;

    if (sample_description_entry instanceof VisualSampleEntry) {
      const sde = sample_description_entry as VisualSampleEntry;
      const vmhd = minf.addBox(new vmhdBox());
      vmhd.graphicsmode = 0;
      vmhd.opcolor = [0, 0, 0];

      sde.width = options.width;
      sde.height = options.height;
      sde.horizresolution = 0x48 << 16;
      sde.vertresolution = 0x48 << 16;
      sde.frame_count = 1;
      sde.compressorname = options.type + ' Compressor';
      sde.depth = 0x18;

      if (options.avcDecoderConfigRecord) {
        const avcC = sde.addBox(new avcCBox(options.avcDecoderConfigRecord.byteLength));
        avcC.parse(new DataStream(options.avcDecoderConfigRecord));
      } else if (options.hevcDecoderConfigRecord) {
        const hvcC = sde.addBox(new hvcCBox(options.hevcDecoderConfigRecord.byteLength));
        hvcC.parse(new DataStream(options.hevcDecoderConfigRecord));
      }
    } else if (sample_description_entry instanceof AudioSampleEntry) {
      const sde = sample_description_entry as AudioSampleEntry;
      const smhd = minf.addBox(new smhdBox());
      smhd.balance = options.balance || 0;

      sde.channel_count = options.channel_count || 2;
      sde.samplesize = options.samplesize || 16;
      sde.samplerate = options.samplerate || 1 << 16;
    } else if (sample_description_entry instanceof HintSampleEntry) {
      minf.addBox(new hmhdBox()); // TODO: add properties
    } else if (sample_description_entry instanceof SubtitleSampleEntry) {
      minf.addBox(new sthdBox());
      if (sample_description_entry instanceof stppSampleEntry) {
        sample_description_entry.namespace = options.namespace || 'nonamespace';
        sample_description_entry.schema_location = options.schema_location || '';
        sample_description_entry.auxiliary_mime_types = options.auxiliary_mime_types || '';
      }
    } else if (sample_description_entry instanceof MetadataSampleEntry) {
      minf.addBox(new nmhdBox());
    } else if (sample_description_entry instanceof SystemSampleEntry) {
      minf.addBox(new nmhdBox());
    } else {
      minf.addBox(new nmhdBox());
    }

    if (options.description) {
      (sample_description_entry.addBox as (box: Box) => Box).call(
        sample_description_entry,
        options.description,
      );
    }
    if (options.description_boxes) {
      options.description_boxes.forEach(function (b) {
        (sample_description_entry.addBox as (box: Box) => Box).call(sample_description_entry, b);
      });
    }
    const dinf = minf.addBox(new dinfBox());
    const dref = dinf.addBox(new drefBox());
    const url = new urlBox();
    url.flags = 0x1;
    dref.addEntry(url);

    const stbl = minf.addBox(new stblBox());
    const stsd = stbl.addBox(new stsdBox());
    stsd.addEntry(sample_description_entry);

    const stts = stbl.addBox(new sttsBox());
    stts.sample_counts = [];
    stts.sample_deltas = [];

    const stsc = stbl.addBox(new stscBox());
    stsc.first_chunk = [];
    stsc.samples_per_chunk = [];
    stsc.sample_description_index = [];

    const stco = stbl.addBox(new stcoBox());
    stco.chunk_offsets = [];
    const stsz = stbl.addBox(new stszBox());
    stsz.sample_sizes = [];

    const trex = this.moov.mvex.addBox(new trexBox());
    trex.track_id = options.id;
    trex.default_sample_description_index = options.default_sample_description_index || 1;
    trex.default_sample_duration = options.default_sample_duration || 0;
    trex.default_sample_size = options.default_sample_size || 0;
    trex.default_sample_flags = options.default_sample_flags || 0;

    this.buildTrakSampleLists(trak);
    return options.id;
  }

  /** @bundle isofile-advanced-creation.js */
  addSample(
    track_id: number,
    data: Uint8Array<ArrayBuffer>,
    {
      sample_description_index,
      duration = 1,
      cts = 0,
      dts = 0,
      is_sync = false,
      is_leading = 0,
      depends_on = 0,
      is_depended_on = 0,
      has_redundancy = 0,
      degradation_priority = 0,
      subsamples,
      offset = 0,
    }: {
      sample_description_index?: number;
      duration?: number;
      cts?: number;
      dts?: number;
      is_sync?: boolean;
      is_leading?: number;
      depends_on?: number;
      is_depended_on?: number;
      has_redundancy?: number;
      degradation_priority?: number;
      subsamples?: Array<SubSample>;
      offset?: number;
    } = {},
  ) {
    const trak = this.getTrackById(track_id);
    if (trak === undefined) return;

    const descriptionIndex = sample_description_index ? sample_description_index - 1 : 0;

    const sample: Sample = {
      number: trak.samples.length,
      track_id: trak.tkhd.track_id,
      timescale: trak.mdia.mdhd.timescale,
      description_index: descriptionIndex,
      description: trak.mdia.minf.stbl.stsd.entries[descriptionIndex],
      data,
      size: data.byteLength,
      alreadyRead: data.byteLength,
      duration,
      cts,
      dts,
      is_sync,
      is_leading,
      depends_on,
      is_depended_on,
      has_redundancy,
      degradation_priority,
      offset,
      subsamples,
    };

    trak.samples.push(sample);
    trak.samples_size += sample.size;
    trak.samples_duration += sample.duration;
    if (trak.first_dts === undefined) {
      trak.first_dts = dts;
    }

    this.processSamples();

    const moof = this.addBox(this.createMoof([sample]));
    moof.computeSize();
    /* adjusting the data_offset now that the moof size is known*/
    moof.trafs[0].truns[0].data_offset = moof.size + 8; //8 is mdat header

    const mdat = this.addBox(new mdatBox());
    mdat.data = new Uint8Array(data);

    return sample;
  }

  /** @bundle isofile-advanced-creation.js */
  createMoof(samples: Array<Sample>) {
    // All samples must be from the same track
    if (samples.length === 0) return;
    if (samples.some(s => s.track_id !== samples[0].track_id)) {
      throw new Error(
        'Cannot create moof for samples from different tracks: ' +
          samples.map(s => s.track_id).join(', '),
      );
    }
    const trackId = samples[0].track_id;
    const trak = this.getTrackById(trackId);
    if (!trak) {
      throw new Error('Cannot create moof for non-existing track: ' + trackId);
    }

    // Create the moof box
    const moof = new moofBox();

    // Add the mfhd box with the sequence number
    const mfhd = moof.addBox(new mfhdBox());
    mfhd.sequence_number = ++this.nextMoofNumber;

    // Create the traf box
    const traf = moof.addBox(new trafBox());

    // Add the tfhd and tfdt boxes
    const tfhd = traf.addBox(new tfhdBox());
    tfhd.track_id = trackId;
    tfhd.flags = TFHD_FLAG_DEFAULT_BASE_IS_MOOF;
    const tfdt = traf.addBox(new tfdtBox());
    tfdt.baseMediaDecodeTime = samples[0].dts - (trak.first_dts || 0);

    // Construct the trun box
    const trun = traf.addBox(new trunBox());
    trun.flags =
      TRUN_FLAGS_DATA_OFFSET |
      TRUN_FLAGS_DURATION |
      TRUN_FLAGS_SIZE |
      TRUN_FLAGS_FLAGS |
      TRUN_FLAGS_CTS_OFFSET;
    trun.data_offset = 0;
    trun.first_sample_flags = 0;
    trun.sample_count = samples.length;

    for (const sample of samples) {
      let sample_flags = 0;
      if (sample.is_sync)
        sample_flags = 1 << 25; // sample_depends_on_none (I picture)
      else sample_flags = 1 << 16; // non-sync

      trun.sample_duration.push(sample.duration);
      trun.sample_size.push(sample.size);
      trun.sample_flags.push(sample_flags);
      trun.sample_composition_time_offset.push(sample.cts - sample.dts);
    }

    return moof;
  }

  /** @bundle box-print.js */
  print(output: Output) {
    output.indent = '';
    for (let i = 0; i < this.boxes.length; i++) {
      if (this.boxes[i]) {
        this.boxes[i].print(output);
      }
    }
  }
}
