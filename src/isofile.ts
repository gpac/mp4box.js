/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */

import type {
  Movie,
  Track,
  ExtractedTrackObject,
  FragmentedTrackObject,
  SegmentOptions,
  ExtractOptions,
  Sample,
} from './types';

import { Box, BoxParser, ContainerBox } from './box';
import { MultiBufferStream, BoxBuffer } from './buffer';
import { Log } from './log';

import iso_print from './box-print';
import iso_write from './isofile-write';
import iso_ac from './isofile-advanced-creation';
import iso_ap from './isofile-advanced-parsing';
import iso_ip from './isofile-item-processing';
import iso_sp from './isofile-sample-processing';

export class ISOFile {
  moov?: ContainerBox;
  nextSeekPosition?: number;
  sidx: any;
  meta: any;
  onItem?: (item: Track) => void;
  ftyp?: Box;
  type?: string;
  initial_duration?: number;

  /* MutiBufferStream object used to parse boxes */
  stream: MultiBufferStream;
  /* Array of all boxes (in order) found in the file */
  boxes: Box[] = [];
  /* Array of all mdats */
  mdats: Box[] = [];
  /* Array of all moofs */
  moofs: Box[] = [];
  /* Boolean indicating if the file is compatible with progressive parsing (moov first) */
  isProgressive = false;
  /* Boolean used to fire moov start event only once */
  moovStartFound = false;
  /* Callback called when the moov parsing starts */
  onMoovStart?: () => void;
  /* Boolean keeping track of the call to onMoovStart, to avoid double calls */
  moovStartSent = false;
  /* Callback called when the moov is entirely parsed */
  onReady?: (info: any) => void;
  /* Boolean keeping track of the call to onReady, to avoid double calls */
  readySent = false;
  /* Callback to call when segments are ready */
  onSegment?: (
    id?: number,
    user?: string,
    buffer?: any,
    sampleNumber?: number,
    last?: boolean
  ) => void;

  /* Callback to call when samples are ready */
  onSamples?: (id?: number, user?: string, samples?: any[]) => void;
  /* Callback to call when there is an error in the parsing or processing of samples */
  onError?: (e?: string) => void;
  /* Boolean indicating if the moov box run-length encoded tables of sample information have been processed */
  sampleListBuilt = false;
  /* Array of Track objects for which fragmentation of samples is requested */
  fragmentedTracks: FragmentedTrackObject[] = [];
  /* Array of Track objects for which extraction of samples is requested */
  extractedTracks: ExtractedTrackObject[] = [];
  /* Boolean indicating that fragmentation is ready */
  isFragmentationInitialized = false;
  /* Boolean indicating that fragmented has started */
  sampleProcessingStarted = false;
  /* Number of the next 'moof' to generate when fragmenting */
  nextMoofNumber = 0;
  /* Boolean indicating if the initial list of items has been produced */
  itemListBuilt = false;
  /* Callback called when the sidx box is entirely parsed */
  onSidx?: (sidx: number) => void;
  /* Boolean keeping track of the call to onSidx, to avoid double calls */
  sidxSent = false;

  constructor(stream?: MultiBufferStream) {
    this.stream = stream || new MultiBufferStream();
  }

  setSegmentOptions(id: number, user?: string | null, options?: SegmentOptions) {
    const trak = this.getTrackById(id);
    if (!trak) return;

    trak.nextSample = 0;
    const fragTrack: FragmentedTrackObject = {
      id,
      user: user || '',
      trak,
      segmentStream: undefined,
      nb_samples: options?.nbSamples || 1000,
      rapAlignement: options?.rapAlignement || true,
    };

    this.fragmentedTracks.push(fragTrack);
  }

  unsetSegmentOptions(id: number) {
    let index = -1;
    this.fragmentedTracks.forEach((fragTrack, idx) => {
      if (fragTrack.id == id) index = idx;
    });
    if (index > -1) this.fragmentedTracks.splice(index, 1);
  }

  setExtractionOptions(id: number, user?: string | null, options?: ExtractOptions) {
    const trak = this.getTrackById(id);
    if (!trak) return;

    trak.nextSample = 0;
    const extractTrack: ExtractedTrackObject = {
      id,
      user: user || '',
      trak,
      samples: [],
      nb_samples: options?.nbSamples || 1000,
    };
    this.extractedTracks.push(extractTrack);
  }

  unsetExtractionOptions(id: number) {
    let index = -1;
    this.extractedTracks.forEach((extractTrack, idx) => {
      if (extractTrack.id == id) index = idx;
    });
    if (index > -1) this.extractedTracks.splice(index, 1);
  }

  parse() {
    const parseBoxHeadersOnly = false;

    if (this.restoreParsePosition && !this.restoreParsePosition()) return;

    while (true) {
      if (this.hasIncompleteMdat && this.hasIncompleteMdat()) {
        if (this.processIncompleteMdat()) continue;
        else return;
      } else {
        if (this.saveParsePosition) {
          this.saveParsePosition();
        }
        const ret = BoxParser.parseOnebox(this.stream, parseBoxHeadersOnly, 0);
        if (ret.code === BoxParser.ERR_NOT_ENOUGH_DATA) {
          if (this.processIncompleteBox) {
            if (this.processIncompleteBox(ret)) continue;
            else return;
          } else return;
        } else {
          /* the box is entirely parsed */
          const { box } = ret;
          if (!box) return;

          const box_type = box.type !== 'uuid' ? box.type : box.uuid;
          /* store the box in the 'boxes' array to preserve box order (for file rewrite if needed)  */
          this.boxes.push(box);
          /* but also store box in a property for more direct access */
          switch (box_type) {
            case 'mdat':
              this.mdats.push(box);
              break;
            case 'moof':
              this.moofs.push(box);
              break;
            case 'moov':
              this.moovStartFound = true;
              if (this.mdats.length === 0) {
                this.isProgressive = true;
              }
            default:
              if (this[box_type as keyof ISOFile] !== undefined) {
                Log.warn(
                  'ISOFile',
                  'Duplicate Box of type: ' + box_type + ', overriding previous occurrence'
                );
              }
              this[box_type as keyof ISOFile] = box as never;
          }

          this.updateUsedBytes && this.updateUsedBytes(box, ret);
        }
      }
    }
  }

  checkBuffer(ab: BoxBuffer) {
    if (ab === null || ab === undefined) throw 'Buffer must be defined and non empty';

    if (ab.fileStart === undefined) throw 'Buffer must have a fileStart property';

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

  /* Processes a new ArrayBuffer (with a fileStart property)
   Returns the next expected file position, or undefined if not ready to parse */
  appendBuffer(ab: BoxBuffer, last?: boolean) {
    let nextFileStart;
    if (!this.checkBuffer(ab)) return;

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
          nextFileStart
      );
      this.stream.logBufferLevel();
      this.stream.cleanBuffers();
      this.stream.logBufferLevel(true);
      Log.info('ISOFile', 'Sample data size in memory: ' + this.getAllocatedSampleDataSize());
    }
    return nextFileStart;
  }

  getInfo() {
    const movie: Movie = {};
    let ref: any;
    // let trak: Track;
    // let track: Partial<Track>;
    let trak: any;
    let track: any;
    let sample_desc: any;
    const _1904 = new Date('1904-01-01T00:00:00Z').getTime();

    if (this.moov) {
      movie.hasMoov = true;
      movie.duration = this.moov.mvhd.duration;
      movie.timescale = this.moov.mvhd.timescale;
      movie.isFragmented = this.moov.mvex != null;
      if (movie.isFragmented && this.moov.mvex.mehd) {
        movie.fragment_duration = this.moov.mvex.mehd.fragment_duration;
      }
      movie.isProgressive = this.isProgressive;
      movie.hasIOD = this.moov.iods != null;
      movie.brands = [];
      movie.brands.push(this.ftyp?.major_brand);
      movie.brands = movie.brands.concat(this.ftyp?.compatible_brands);
      movie.created = new Date(_1904 + this.moov.mvhd.creation_time * 1000);
      movie.modified = new Date(_1904 + this.moov.mvhd.modification_time * 1000);
      movie.tracks = [];
      movie.audioTracks = [];
      movie.videoTracks = [];
      movie.subtitleTracks = [];
      movie.metadataTracks = [];
      movie.hintTracks = [];
      movie.otherTracks = [];
      for (let i = 0; i < this.moov.traks.length; i++) {
        trak = this.moov.traks[i];
        sample_desc = trak.mdia.minf.stbl.stsd.entries[0];
        track = {};
        movie.tracks.push(track);
        track.id = trak.tkhd.track_id;
        track.name = trak.mdia.hdlr.name;
        track.references = [];
        if (trak.tref) {
          for (let j = 0; j < trak.tref.boxes.length; j++) {
            ref = {};
            track.references.push(ref);
            ref.type = trak.tref.boxes[j].type;
            ref.track_ids = trak.tref.boxes[j].track_ids;
          }
        }
        if (trak.edts) {
          track.edits = trak.edts.elst.entries;
        }
        track.created = new Date(_1904 + trak.tkhd.creation_time * 1000);
        track.modified = new Date(_1904 + trak.tkhd.modification_time * 1000);
        track.movie_duration = trak.tkhd.duration;
        track.movie_timescale = movie.timescale;
        track.layer = trak.tkhd.layer;
        track.alternate_group = trak.tkhd.alternate_group;
        track.volume = trak.tkhd.volume;
        track.matrix = trak.tkhd.matrix;
        track.track_width = trak.tkhd.width / (1 << 16);
        track.track_height = trak.tkhd.height / (1 << 16);
        track.timescale = trak.mdia.mdhd.timescale;
        track.cts_shift = trak.mdia.minf.stbl.cslg;
        track.duration = trak.mdia.mdhd.duration;
        track.samples_duration = trak.samples_duration;
        track.codec = sample_desc.getCodec();
        track.kind =
          trak.udta && trak.udta.kinds.length ? trak.udta.kinds[0] : { schemeURI: '', value: '' };
        track.language = trak.mdia.elng
          ? trak.mdia.elng.extended_language
          : trak.mdia.mdhd.languageString;
        track.nb_samples = trak.samples.length;
        track.size = trak.samples_size;
        track.bitrate = (track.size * 8 * track.timescale) / track.samples_duration;
        if (sample_desc.isAudio()) {
          track.type = 'audio';
          movie.audioTracks.push(track);
          track.audio = {};
          track.audio.sample_rate = sample_desc.getSampleRate();
          track.audio.channel_count = sample_desc.getChannelCount();
          track.audio.sample_size = sample_desc.getSampleSize();
        } else if (sample_desc.isVideo()) {
          track.type = 'video';
          movie.videoTracks.push(track);
          track.video = {};
          track.video.width = sample_desc.getWidth();
          track.video.height = sample_desc.getHeight();
        } else if (sample_desc.isSubtitle()) {
          track.type = 'subtitles';
          movie.subtitleTracks.push(track);
        } else if (sample_desc.isHint()) {
          track.type = 'metadata';
          movie.hintTracks.push(track);
        } else if (sample_desc.isMetadata()) {
          track.type = 'metadata';
          movie.metadataTracks.push(track);
        } else {
          track.type = 'metadata';
          movie.otherTracks.push(track);
        }
      }
    } else {
      movie.hasMoov = false;
    }
    movie.mime = '';
    if (movie.hasMoov && movie.tracks) {
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
      movie.mime += this.ftyp?.compatible_brands.join();
      movie.mime += '"';
    }
    return movie;
  }

  processSamples(last?: boolean) {
    if (!this.sampleProcessingStarted) return;

    let trak: Track;
    /* For each track marked for fragmentation,
       check if the next sample is there (i.e. if the sample information is known (i.e. moof has arrived) and if it has been downloaded)
       and create a fragment with it */
    if (this.isFragmentationInitialized && this.onSegment !== undefined) {
      for (let i = 0; i < this.fragmentedTracks.length; i++) {
        const fragTrak = this.fragmentedTracks[i];
        trak = fragTrak.trak;
        while (trak.nextSample < trak.samples.length && this.sampleProcessingStarted) {
          /* The sample information is there (either because the file is not fragmented and this is not the last sample,
          or because the file is fragmented and the moof for that sample has been received */
          Log.debug(
            'ISOFile',
            'Creating media fragment on track #' + fragTrak.id + ' for sample ' + trak.nextSample
          );
          const result = this.createFragment(
            fragTrak.id || 0,
            trak.nextSample,
            fragTrak.segmentStream
          );
          if (result) {
            fragTrak.segmentStream = result;
            trak.nextSample++;
          } else {
            /* The fragment could not be created because the media data is not there (not downloaded), wait for it */
            break;
          }
          /* A fragment is created by sample, but the segment is the accumulation in the buffer of these fragments.
             It is flushed only as requested by the application (nb_samples) to avoid too many callbacks */
          if (
            trak.nextSample % fragTrak.nb_samples === 0 ||
            last ||
            trak.nextSample >= trak.samples.length
          ) {
            Log.info(
              'ISOFile',
              'Sending fragmented data on track #' +
                fragTrak.id +
                ' for samples [' +
                Math.max(0, trak.nextSample - fragTrak.nb_samples) +
                ',' +
                (trak.nextSample - 1) +
                ']'
            );
            Log.info('ISOFile', 'Sample data size in memory: ' + this.getAllocatedSampleDataSize());

            this.onSegment(
              fragTrak.id,
              fragTrak.user,
              fragTrak.segmentStream.buffer,
              trak.nextSample,
              last || trak.nextSample >= trak.samples.length
            );

            /* force the creation of a new buffer */
            fragTrak.segmentStream = undefined;
            if (fragTrak !== this.fragmentedTracks[i]) {
              /* make sure we can stop fragmentation if needed */
              break;
            }
          }
        }
      }
    }

    if (!this.onSamples) return;
    /* For each track marked for data export,
         check if the next sample is there (i.e. has been downloaded) and send it */
    for (let i = 0; i < this.extractedTracks.length; i++) {
      const extractTrak = this.extractedTracks[i];
      trak = extractTrak.trak;
      while (trak.nextSample < trak.samples.length && this.sampleProcessingStarted) {
        Log.debug(
          'ISOFile',
          'Exporting on track #' + extractTrak.id + ' sample #' + trak.nextSample
        );
        const sample = this.getSample(trak, trak.nextSample);
        if (sample) {
          trak.nextSample++;
          extractTrak.samples && extractTrak.samples.push(sample);
        } else break;

        if (
          trak.nextSample % extractTrak.nb_samples === 0 ||
          trak.nextSample >= trak.samples.length
        ) {
          Log.debug(
            'ISOFile',
            'Sending samples on track #' + extractTrak.id + ' for sample ' + trak.nextSample
          );
          this.onSamples(extractTrak.id, extractTrak.user, extractTrak.samples);

          extractTrak.samples = [];
          if (extractTrak !== this.extractedTracks[i]) {
            /* check if the extraction needs to be stopped */
            break;
          }
        }
      }
    }
  }

  /* Find and return specific boxes using recursion and early return */
  getBox(type: string) {
    const result = this.getBoxes(type, true);
    return result.length ? result[0] : null;
  }

  getBoxes(type: string, returnEarly: boolean) {
    const result: any[] = [];
    ISOFile._sweep.call(this, type, result, returnEarly);
    return result;
  }

  static _sweep(this: any, type: string, result: any[], returnEarly: boolean) {
    if (this.type && this.type == type) result.push(this);
    // TODO:
    for (const box in this.boxes) {
      if (result.length && returnEarly) return;
      ISOFile._sweep.call(this.boxes[box], type, result, returnEarly);
    }
  }

  getTrackSamplesInfo(track_id: number) {
    const track = this.getTrackById(track_id);
    return track ? track.samples : undefined;
  }

  getTrackSample(track_id: number, number: number): Sample | null {
    const track = this.getTrackById(track_id);
    return track ? this.getSample(track, number) : null;
  }

  /* Called by the application to release the resources associated to samples already forwarded to the application */
  releaseUsedSamples(id: number, sampleNum: number): void {
    let size = 0;
    const trak = this.getTrackById(id);
    if (!trak) return;
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
        ')'
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
  seekTrack(time: number, useRap: boolean, trak: Track) {
    let sample;
    let seek_offset = Infinity;
    let rap_seek_sample_num = 0;
    let seek_sample_num = 0;
    let timescale = 1;

    if (trak.samples.length === 0) {
      Log.info(
        'ISOFile',
        'No sample in track, cannot seek! Using time ' +
          // Log.getDurationString(0, 1) +
          ' and offset: ' +
          0
      );
      return { offset: 0, time: 0 };
    }

    for (let j = 0; j < trak.samples.length; j++) {
      sample = trak.samples[j];
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
    seek_offset = trak.samples[seek_sample_num].offset + trak.samples[seek_sample_num].alreadyRead;
    Log.info(
      'ISOFile',
      'Seeking to ' +
        (useRap ? 'RAP' : '') +
        ' sample #' +
        trak.nextSample +
        ' on track ' +
        trak.tkhd.track_id +
        ', time ' +
        // Log.getDurationString(time, timescale) +
        ' and offset: ' +
        seek_offset
    );
    return { offset: seek_offset, time: time / timescale };
  }

  /* Finds the byte offset in the file corresponding to the given time or to the time of the previous RAP */
  seek(time: number, useRap: boolean) {
    const moov = this.moov;
    let trak;
    let trak_seek_info;
    const seek_info = { offset: Infinity, time: Infinity };
    if (!this.moov) throw 'Cannot seek: moov not received!';

    for (let i = 0; i < moov?.traks.length; i++) {
      trak = moov?.traks[i];
      trak_seek_info = this.seekTrack(time, useRap, trak);
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
        // Log.getDurationString(seek_info.time, 1) +
        ' needs a buffer with a fileStart position of ' +
        seek_info.offset
    );
    if (seek_info.offset === Infinity) {
      /* No sample info, in all tracks, cannot seek */
      seek_info.offset = this.nextParsePosition;
      seek_info.time = 0;
    } else {
      /* check if the seek position is already in some buffer and
         in that case return the end of that buffer (or of the last contiguous buffer) */
      /* TODO: Should wait until append operations are done */
      seek_info.offset = this.stream.getEndFilePositionAfter(seek_info.offset);
    }
    Log.info(
      'ISOFile',
      'Adjusted seek position (after checking data already in buffer): ' + seek_info.offset
    );
    return seek_info;
  }

  equal(b: ISOFile) {
    let box_index = 0;
    while (box_index < this.boxes.length && box_index < b.boxes.length) {
      const a_box = this.boxes[box_index];
      const b_box = b.boxes[box_index];
      if (!BoxParser.boxEqual(a_box, b_box)) return false;
      box_index++;
    }
    return true;
  }

  print = iso_print.ISOFile.print;

  write = iso_write.write;
  createFragment = iso_write.createFragment;
  save = iso_write.save;
  getBuffer = iso_write.getBuffer;
  initializeSegmentation = iso_write.initializeSegmentation;
  static writeInitializationSegment = iso_write.writeInitializationSegment;

  init = iso_ac.init;
  addTrack = iso_ac.addTrack;
  addSample = iso_ac.addSample;
  createSingleSampleMoof = iso_ac.createSingleSampleMoof;
  add(name: string) {
    return Box.prototype.add.call(this, name);
  }
  addbox(box: Box) {
    return Box.prototype.addbox.call(this, box);
  }

  lastBoxStartPosition = iso_ap.lastBoxStartPosition;
  parsingMdat = iso_ap.parsingMdat;
  nextParsePosition = iso_ap.nextParsePosition;
  discardMdatData = iso_ap.discardMdatData;
  processIncompleteBox = iso_ap.processIncompleteBox;
  hasIncompleteMdat = iso_ap.hasIncompleteMdat;
  processIncompleteMdat = iso_ap.processIncompleteMdat;
  restoreParsePosition = iso_ap.restoreParsePosition;
  saveParsePosition = iso_ap.saveParsePosition;
  updateUsedBytes = iso_ap.updateUsedBytes;

  items = iso_ip.items;
  itemsDataSize = iso_ip.itemsDataSize;
  flattenItemInfo = iso_ip.flattenItemInfo;
  getItem = iso_ip.getItem;
  releaseItem = iso_ip.releaseItem;
  processItems = iso_ip.processItems;
  hasItem = iso_ip.hasItem;
  getMetaHandler = iso_ip.getMetaHandler;
  getPrimaryItem = iso_ip.getPrimaryItem;
  itemToFragmentedTrackFile = iso_ip.itemToFragmentedTrackFile;

  lastMoofIndex = iso_sp.lastMoofIndex;
  samplesDataSize = iso_sp.samplesDataSize;
  resetTables = iso_sp.resetTables;
  buildSampleLists = iso_sp.buildSampleLists;
  buildTrakSampleLists = iso_sp.buildTrakSampleLists;
  updateSampleLists = iso_sp.updateSampleLists;
  getSample = iso_sp.getSample;
  releaseSample = iso_sp.releaseSample;
  getAllocatedSampleDataSize = iso_sp.getAllocatedSampleDataSize;
  getCodecs = iso_sp.getCodecs;
  getTrexById = iso_sp.getTrexById;
  getTrackById = iso_sp.getTrackById;
  static initSampleGroups = iso_sp.initSampleGroups;
  static setSampleGroupProperties = iso_sp.setSampleGroupProperties;
  static process_sdtp = iso_sp.process_sdtp;
}
