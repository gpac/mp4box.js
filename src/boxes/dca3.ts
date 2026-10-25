/*
 * Copyright (c) 2026. Paul Higgs
 * License: BSD-3-Clause (see LICENSE file)
 */

import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

// values for audio_codec_id
const enum AudioCodecId {
  HIGH_RATE_CODING = 0,
  LOSSLESS_CODING = 1,
  FULL_RATE_CODING = 2,
}

// values for content_type
const enum ChannelType {
  CHANNEL_BASED = 0,
  OBJECT_BASED = 1,
  CHANNEL_AND_OBJECT = 2,
  HOA = 3,
}

abstract class AVS3AudioBase {
  //eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
  constructor() {}

  stringify(data: unknown): string {
    let result = '';
    const ownProperties = Object.getOwnPropertyNames(data);
    ownProperties.forEach(property => {
      let formatted_value = '';
      if (Array.isArray(data[property])) {
        for (let i = 0; i < data[property].length; i++) {
          const hex = data[property][i].toString(16);
          formatted_value += hex.length === 1 ? '0' + hex : hex;
          if (i % 4 === 3) formatted_value += ' ';
        }
      } else formatted_value = data[property];
      result += `${property}: ${formatted_value}\n`;
    });
    return result;
  }
}

class AVS3GAConfig extends AVS3AudioBase {
  data: {
    sampling_frequency_index?: number;
    nn_type?: number;
    content_type?: number;
    channel_number_index?: number;
    number_objects?: number;
    hoa_order?: number;
    total_bitrate?: number;
    resolution?: number;
  };

  constructor(stream: MultiBufferStream) {
    super();
    this.data = {};
    this.deserialise(stream);
  }

  deserialise(stream: MultiBufferStream) {
    this.data.sampling_frequency_index = stream.readBits(4);
    this.data.nn_type = stream.readBits(3);
    stream.skipBits(1);
    this.data.content_type = stream.readBits(4);
    if (this.data.content_type === ChannelType.CHANNEL_BASED) {
      this.data.channel_number_index = stream.readBits(7);
      stream.skipBits(1);
    } else if (this.data.content_type === ChannelType.OBJECT_BASED) {
      this.data.number_objects = stream.readBits(7);
      stream.skipBits(1);
    } else if (this.data.content_type === ChannelType.CHANNEL_AND_OBJECT) {
      this.data.channel_number_index = stream.readBits(7);
      stream.skipBits(1);
      this.data.number_objects = stream.readBits(7);
      stream.skipBits(1);
    } else if (this.data.content_type === ChannelType.HOA) {
      this.data.hoa_order = stream.readBits(4);
    }
    this.data.total_bitrate = stream.readUint16();
    this.data.resolution = stream.readBits(2);
  }

  toString = (): string => {
    return super.stringify(this.data);
  };
}

class AVS3GHConfig extends AVS3AudioBase {
  data: {
    sampling_frequency_index?: number;
    anc_data_index?: number;
    coding_profile?: number;
    bitstream_type?: number;
    channel_number_index?: number;
    bitrate_index?: number;
    raw_frame_length?: number;
    resolution?: number;
    addition_info?: Array<number>;
  };

  constructor(stream: MultiBufferStream) {
    super();
    this.data = {};
    this.deserialise(stream);
  }

  deserialise(stream: MultiBufferStream) {
    this.data.sampling_frequency_index = stream.readBits(4);
    this.data.anc_data_index = stream.readBits(1);
    this.data.coding_profile = stream.readBits(3);
    this.data.bitstream_type = stream.readBits(1);
    this.data.channel_number_index = stream.readBits(7);
    this.data.bitrate_index = stream.readBits(4);
    this.data.raw_frame_length = stream.readUint16();
    this.data.resolution = stream.readBits(2);
    const addition_info_length = stream.readUint16();
    if (addition_info_length > 0) {
      this.data.addition_info = [];
      for (let i = 0; i < addition_info_length; i++) {
        this.data.addition_info.push(stream.readUint8());
      }
    }
  }

  toString = (): string => {
    return super.stringify(this.data);
  };
}

class AVS3LLConfig extends AVS3AudioBase {
  data: {
    sampling_frequency_index?: number;
    sampling_frequency?: number;
    anc_data_index?: number;
    coding_profile?: number;
    channel_number?: number;
    resolution?: number;
    addition_info?: Array<number>;
  };

  constructor(stream: MultiBufferStream) {
    super();
    this.data = {};
    this.deserialise(stream);
  }

  deserialise(stream: MultiBufferStream) {
    this.data.sampling_frequency_index = stream.readBits(4);
    if (this.data.sampling_frequency_index === 0xf) {
      this.data.sampling_frequency = stream.readUint24();
    }
    this.data.anc_data_index = stream.readBits(1);
    this.data.coding_profile = stream.readBits(3);
    this.data.channel_number = stream.readUint8();
    this.data.resolution = stream.readBits(2);
    const addition_info_length = stream.readUint16();
    if (addition_info_length > 0) {
      this.data.addition_info = [];
      for (let i = 0; i < addition_info_length; i++) {
        this.data.addition_info.push(stream.readUint8());
      }
    }
    stream.skipBits(2); // reserved
  }

  toString = (): string => {
    return super.stringify(this.data);
  };
}

export class dca3Box extends Box {
  static override readonly fourcc = 'dca3' as const;
  box_name = 'AVS3AConfigurationBox' as const;

  audio_codec_id: number;
  Avs3AudioGAConfig?: AVS3GAConfig;
  Avs3AudioGHConfig?: AVS3GHConfig;
  Avs3AudioLLConfig?: AVS3LLConfig;

  parse(stream: MultiBufferStream) {
    stream.enterBitMode();
    this.audio_codec_id = stream.readBits(4);

    switch (this.audio_codec_id) {
      case AudioCodecId.FULL_RATE_CODING:
        this.Avs3AudioGAConfig = new AVS3GAConfig(stream);
        break;
      case AudioCodecId.HIGH_RATE_CODING:
        this.Avs3AudioGHConfig = new AVS3GHConfig(stream);
        break;
      case AudioCodecId.LOSSLESS_CODING:
        this.Avs3AudioLLConfig = new AVS3LLConfig(stream);
        break;
    }
    stream.exitBitMode(false); // bit padding till byte alignmentstream.byte_alignment();
  }

  get_audio_codec_id_str(): string {
    return this.audio_codec_id.toString(10).padStart(2, '0');
  }
}
