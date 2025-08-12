/*
 * Copyright (c) 2025. Paul Higgs
 * License: BSD-3-Clause (see LICENSE file)
 */

import { Box } from '#/box';
import { MP4BoxStream } from '#/stream';
import { BitBuffer } from '#/BitBuffer';

import { DescribedValue, AVS3data } from './avs-common';

// values for audio_codec_id
const HIGH_RATE_CODING = 0,
  LOSSLESS_CODING = 1,
  FULL_RATE_CODING = 2;

// values for content_type
const CHANNEL_BASED = 0,
  OBJECT_BASED = 1,
  CHANNEL_AND_OBJECT = 2,
  HOA = 3;

function AVS3Acodec(codec_id: number) {
  const codecs = ['General High Rate', 'Lossless', 'General Full Rate'];
  return codec_id < codecs.length ? codecs[codec_id] : 'undefined';
}

function AVS3Achannel_number(channel_number_index: number) {
  const configs = [
    'Mono',
    'Stereo',
    '5.1',
    '7.1',
    '10.2',
    '22.2',
    '4.0/FOA',
    '5.1.2',
    '5.1.4',
    '7.1.2',
    '7.1.4',
    '3rd HOA',
    '2nd HOA',
  ];
  return channel_number_index < configs.length ? configs[channel_number_index] : 'undefined';
}

function AVS3Asampling_frequency(sampling_frequency_index: number) {
  const frequencies = [192000, 96000, 48000, 44100, 32000, 24000, 22050, 16000, 8000];
  return sampling_frequency_index < frequencies.length
    ? frequencies[sampling_frequency_index] + 'Hz'
    : 'reserved';
}

function AVS3Aresolution(resolution: number) {
  switch (resolution) {
    case 0:
      return '8 bits/sample';
    case 1:
      return '16 bits/sample';
    case 2:
      return '24 bits/sample';
  }
  return 'reserved';
}

function AVS3Anntype(nn_type: number) {
  switch (nn_type) {
    case 0:
      return 'basic neural network';
    case 1:
      return 'low-complexity neural network';
  }
  return 'reserved';
}

function AVS3Acodingprofile(conding_profile: number) {
  switch (conding_profile) {
    case 0:
      return 'basic framework';
    case 1:
      return 'object metadata framework';
    case 2:
      return 'HOA data coding framework';
  }
  return 'reserved';
}

interface GAconfig {
  sampling_frequency_index?: DescribedValue;
  nn_type?: DescribedValue;
  content_type?: number;
  channel_number_index?: DescribedValue;
  number_objects?: number;
  hoa_order?: number;
  total_bitrate?: number;
  resolution?: DescribedValue;
}
class AVS3GAConfig extends AVS3data {
  data: GAconfig;
  constructor(bit_reader: BitBuffer) {
    super();
    this.data = {};
    this.deserialise(bit_reader);
  }
  deserialise(bit_reader: BitBuffer) {
    this.data.sampling_frequency_index = new DescribedValue(
      bit_reader.getBits(4),
      AVS3Asampling_frequency,
    );
    this.data.nn_type = new DescribedValue(bit_reader.getBits(3), AVS3Anntype);
    bit_reader.skipBits(1);
    this.data.content_type = bit_reader.getBits(4);
    if (this.data.content_type === CHANNEL_BASED) {
      this.data.channel_number_index = new DescribedValue(
        bit_reader.getBits(7),
        AVS3Achannel_number,
      );
      bit_reader.skipBits(1);
    } else if (this.data.content_type === OBJECT_BASED) {
      this.data.number_objects = bit_reader.getBits(7);
      bit_reader.skipBits(1);
    } else if (this.data.content_type === CHANNEL_AND_OBJECT) {
      this.data.channel_number_index = new DescribedValue(
        bit_reader.getBits(7),
        AVS3Achannel_number,
      );
      bit_reader.skipBits(1);
      this.data.number_objects = bit_reader.getBits(7);
      bit_reader.skipBits(1);
    } else if (this.data.content_type === HOA) {
      this.data.hoa_order = bit_reader.getBits(4);
    }
    this.data.total_bitrate = bit_reader.getUint16();
    this.data.resolution = new DescribedValue(bit_reader.getBits(2), AVS3Aresolution);
  }
  toString(): string {
    return super.toString(this.data);
  }
}

interface GHconfig {
  sampling_frequency_index?: number;
  anc_data_index?: number;
  coding_profile?: DescribedValue;
  bitstream_type?: number;
  channel_number_index?: number;
  bitrate_index?: number;
  raw_frame_length?: number;
  resolution?: DescribedValue;
  addition_info?: Array<number>;
}
class AVS3GHConfig extends AVS3data {
  data: GHconfig;
  constructor(bit_reader: BitBuffer) {
    super();
    this.data = {};
    this.deserialise(bit_reader);
  }
  deserialise(bit_reader: BitBuffer) {
    this.data.sampling_frequency_index = bit_reader.getBits(4);
    this.data.anc_data_index = bit_reader.getBit();
    this.data.coding_profile = new DescribedValue(bit_reader.getBits(3), AVS3Acodingprofile);
    this.data.bitstream_type = bit_reader.getBits(1);
    this.data.channel_number_index = bit_reader.getBits(7);
    this.data.bitrate_index = bit_reader.getBits(4);
    this.data.raw_frame_length = bit_reader.getUint16();
    this.data.resolution = new DescribedValue(bit_reader.getBits(2), AVS3Aresolution);
    const addition_info_length = bit_reader.getUint16();
    if (addition_info_length > 0) {
      this.data.addition_info = [];
      for (let i = 0; i < addition_info_length; i++)
        this.data.addition_info.push(bit_reader.getUint8());
    }
  }
  toString(): string {
    return super.toString(this.data);
  }
}

interface LLconfig {
  sampling_frequency_index?: number;
  sampling_frequency?: number;
  anc_data_index?: number;
  coding_profile?: DescribedValue;
  channel_number?: number;
  resolution?: DescribedValue;
  addition_info?: Array<number>;
}
class AVS3LLConfig extends AVS3data {
  data: LLconfig;
  constructor(bit_reader: BitBuffer) {
    super();
    this.data = {};
    this.deserialise(bit_reader);
  }
  deserialise(bit_reader: BitBuffer) {
    this.data.sampling_frequency_index = bit_reader.getBits(4);
    if (this.data.sampling_frequency_index === 0xf)
      this.data.sampling_frequency = bit_reader.getUint24();
    this.data.anc_data_index = bit_reader.getBit();
    this.data.coding_profile = new DescribedValue(bit_reader.getBits(3), AVS3Acodingprofile);
    this.data.channel_number = bit_reader.getUint8();
    this.data.resolution = new DescribedValue(bit_reader.getBits(2), AVS3Aresolution);
    const addition_info_length = bit_reader.getUint16();
    if (addition_info_length > 0) {
      this.data.addition_info = [];
      for (let i = 0; i < addition_info_length; i++)
        this.data.addition_info.push(bit_reader.getUint8());
    }
    bit_reader.skipBits(2); // reserved
  }
  toString(): string {
    return super.toString(this.data);
  }
}

export class dca3Box extends Box {
  static override readonly fourcc = 'dca3' as const;
  box_name = 'AVS3AConfigurationBox' as const;

  private audio_codec_id: DescribedValue;
  private Avs3AudioGAConfig?: AVS3GAConfig;
  private Avs3AudioGHConfig?: AVS3GHConfig;
  private Avs3AudioLLConfig?: AVS3LLConfig;

  parse(stream: MP4BoxStream) {
    const bit_reader = new BitBuffer();
    for (let i = 0; i < this.size - this.hdr_size; i++) bit_reader.appendUint8(stream.readUint8());
    this.audio_codec_id = new DescribedValue(bit_reader.getBits(4), AVS3Acodec);

    switch (this.audio_codec_id.value) {
      case FULL_RATE_CODING:
        this.Avs3AudioGAConfig = new AVS3GAConfig(bit_reader);
        break;
      case HIGH_RATE_CODING:
        this.Avs3AudioGHConfig = new AVS3GHConfig(bit_reader);
        break;
      case LOSSLESS_CODING:
        this.Avs3AudioLLConfig = new AVS3LLConfig(bit_reader);
        break;
    }
    bit_reader.byte_alignment();
  }

  get_audio_codec_id_str() {
    return this.audio_codec_id.value.toString(10).padStart(2, '0');
  }
}
