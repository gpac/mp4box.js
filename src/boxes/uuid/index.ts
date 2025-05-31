import { Box, FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { parseHex16 } from '#/parser';

class UUIDBox extends Box {
  static fourcc = 'uuid' as const;
  static uuid?: string;
}

class UUIDFullBox extends FullBox {
  static fourcc = 'uuid' as const;
  static uuid?: string;
}

// piff
export class piffLsmBox extends UUIDFullBox {
  static uuid = 'a5d40b30e81411ddba2f0800200c9a66' as const;
  box_name = 'LiveServerManifestBox' as const;

  LiveServerManifest: string;

  parse(stream: MultiBufferStream): void {
    this.parseFullHeader(stream);
    this.LiveServerManifest = stream
      .readString(this.size - this.hdr_size)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

export class piffPsshBox extends UUIDFullBox {
  static uuid = 'd08a4f1810f34a82b6c832d8aba183d3' as const;
  box_name = 'PiffProtectionSystemSpecificHeaderBox' as const;

  system_id: string;

  parse(stream: MultiBufferStream): void {
    this.parseFullHeader(stream);
    this.system_id = parseHex16(stream);
    const datasize = stream.readUint32();
    if (datasize > 0) {
      this.data = stream.readUint8Array(datasize);
    }
  }
}

export class piffSencBox extends UUIDFullBox {
  static uuid = 'a2394f525a9b4f14a2446c427c648df4' as const;
  box_name = 'PiffSampleEncryptionBox' as const;
}

export class piffTencBox extends UUIDFullBox {
  static uuid = '8974dbce7be74c5184f97148f9882554' as const;
  box_name = 'PiffTrackEncryptionBox' as const;

  default_AlgorithmID: number;
  default_IV_size: number;
  default_KID: string;

  parse(stream: MultiBufferStream): void {
    this.parseFullHeader(stream);
    this.default_AlgorithmID = stream.readUint24();
    this.default_IV_size = stream.readUint8();
    this.default_KID = parseHex16(stream);
  }
}

export class piffTfrfBox extends UUIDFullBox {
  static uuid = 'd4807ef2ca3946958e5426cb9e46a79f' as const;
  box_name = 'TfrfBox' as const;

  fragment_count: number;
  entries: Array<{ absolute_time: number; absolute_duration: number }>;

  parse(stream: MultiBufferStream): void {
    this.parseFullHeader(stream);
    this.fragment_count = stream.readUint8();
    this.entries = [];

    for (let i = 0; i < this.fragment_count; i++) {
      let absolute_time = 0;
      let absolute_duration = 0;

      if (this.version === 1) {
        absolute_time = stream.readUint64();
        absolute_duration = stream.readUint64();
      } else {
        absolute_time = stream.readUint32();
        absolute_duration = stream.readUint32();
      }

      this.entries.push({
        absolute_time,
        absolute_duration,
      });
    }
  }
}

export class piffTfxdBox extends UUIDFullBox {
  static uuid = '6d1d9b0542d544e680e2141daff757b2' as const;
  box_name = 'TfxdBox' as const;

  absolute_time: number;
  duration: number;

  parse(stream: MultiBufferStream): void {
    this.parseFullHeader(stream);
    if (this.version === 1) {
      this.absolute_time = stream.readUint64();
      this.duration = stream.readUint64();
    } else {
      this.absolute_time = stream.readUint32();
      this.duration = stream.readUint32();
    }
  }
}

// GIMI
export class ItemContentIDPropertyBox extends UUIDBox {
  static uuid = '261ef3741d975bbaacbd9d2c8ea73522' as const;
  box_name = 'ItemContentIDProperty' as const;

  content_id: string;

  parse(stream: MultiBufferStream): void {
    this.content_id = stream.readCString();
  }
}
