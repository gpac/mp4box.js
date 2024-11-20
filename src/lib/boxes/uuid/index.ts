import { UUIDBox, parseHex16 } from '#/box';
import { MultiBufferStream } from '#/buffer';

export const UUIDBoxes = {
  // piff
  a5d40b30e81411ddba2f0800200c9a66: class piffLsmBox extends UUIDBox {
    LiveServerManifest: string;

    constructor(size?: number) {
      super('a5d40b30e81411ddba2f0800200c9a66', size);
    }

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
  },
  d08a4f1810f34a82b6c832d8aba183d3: class piffPsshBox extends UUIDBox {
    system_id: string;

    constructor(size?: number) {
      super('d08a4f1810f34a82b6c832d8aba183d3', size);
    }

    parse(stream: MultiBufferStream): void {
      this.parseFullHeader(stream);
      this.system_id = parseHex16(stream);
      const datasize = stream.readUint32();
      if (datasize > 0) {
        this.data = stream.readUint8Array(datasize);
      }
    }
  },
  a2394f525a9b4f14a2446c427c648df4: class piffSencBox extends UUIDBox {
    constructor(size?: number) {
      super('a2394f525a9b4f14a2446c427c648df4', size);
    }
  },
  '8974dbce7be74c5184f97148f9882554': class piffTencBox extends UUIDBox {
    default_AlgorithmID: number;
    default_IV_size: number;
    default_KID: string;

    constructor(size?: number) {
      super('8974dbce7be74c5184f97148f9882554', size);
    }

    parse(stream: MultiBufferStream): void {
      this.parseFullHeader(stream);
      this.default_AlgorithmID = stream.readUint24();
      this.default_IV_size = stream.readUint8();
      this.default_KID = parseHex16(stream);
    }
  },
  d4807ef2ca3946958e5426cb9e46a79f: class piffTfrfBox extends UUIDBox {
    fragment_count: number;
    entries: { absolute_time: number; absolute_duration: number }[];

    constructor(size?: number) {
      super('d4807ef2ca3946958e5426cb9e46a79f', size);
    }

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
  },
  '6d1d9b0542d544e680e2141daff757b2': class piffTfxdBox extends UUIDBox {
    absolute_time: number;
    duration: number;

    constructor(size?: number) {
      super('6d1d9b0542d544e680e2141daff757b2', size);
    }

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
  },
};
