import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { MAX_UINT32 } from '#/constants';

interface Reference {
  reference_type: number;
  referenced_size: number;
  subsegment_duration: number;
  starts_with_SAP: number;
  SAP_type: number;
  SAP_delta_time: number;
}

export class sidxBox extends FullBox {
  static override readonly fourcc = 'sidx' as const;
  box_name = 'CompressedSegmentIndexBox' as const;

  reference_ID: number;
  timescale: number;
  earliest_presentation_time: number;
  first_offset: number;
  references: Array<Reference>;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.reference_ID = stream.readUint32();
    this.timescale = stream.readUint32();

    if (this.version === 0) {
      this.earliest_presentation_time = stream.readUint32();
      this.first_offset = stream.readUint32();
    } else {
      this.earliest_presentation_time = stream.readUint64();
      this.first_offset = stream.readUint64();
    }

    stream.readUint16();

    this.references = [];

    const count = stream.readUint16();

    for (let i = 0; i < count; i++) {
      const type = stream.readUint32();
      const subsegment_duration = stream.readUint32();
      const sap = stream.readUint32();

      this.references.push({
        reference_type: (type >> 31) & 0x1,
        referenced_size: type & 0x7fffffff,
        subsegment_duration,
        starts_with_SAP: (sap >> 31) & 0x1,
        SAP_type: (sap >> 28) & 0x7,
        SAP_delta_time: sap & 0xfffffff,
      });
    }
  }

  /** @bundle writing/sidx.js */
  write(stream: MultiBufferStream) {
    const useVersion1 =
      this.earliest_presentation_time > MAX_UINT32 ||
      this.first_offset > MAX_UINT32 ||
      this.version === 1;
    this.version = useVersion1 ? 1 : 0;

    this.size = 4 * 2 + 2 + 2 + 12 * this.references.length;
    this.size += useVersion1 ? 16 : 8; // earliest_presentation_time and first_offset

    this.flags = 0;
    this.writeHeader(stream);

    stream.writeUint32(this.reference_ID);
    stream.writeUint32(this.timescale);
    if (useVersion1) {
      stream.writeUint64(this.earliest_presentation_time);
      stream.writeUint64(this.first_offset);
    } else {
      stream.writeUint32(this.earliest_presentation_time);
      stream.writeUint32(this.first_offset);
    }
    stream.writeUint16(0);
    stream.writeUint16(this.references.length);
    for (let i = 0; i < this.references.length; i++) {
      const ref = this.references[i];
      stream.writeUint32((ref.reference_type << 31) | ref.referenced_size);
      stream.writeUint32(ref.subsegment_duration);
      stream.writeUint32((ref.starts_with_SAP << 31) | (ref.SAP_type << 28) | ref.SAP_delta_time);
    }
  }
}
