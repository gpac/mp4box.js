import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class emsgBox extends FullBox {
  static override readonly fourcc = 'emsg' as const;
  box_name = 'EventMessageBox' as const;

  timescale: number;
  presentation_time: number;
  event_duration: number;
  id: number;
  scheme_id_uri: string;
  value: string;
  presentation_time_delta: number;
  message_data: Uint8Array;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.version === 1) {
      this.timescale = stream.readUint32();
      this.presentation_time = stream.readUint64();
      this.event_duration = stream.readUint32();
      this.id = stream.readUint32();
      this.scheme_id_uri = stream.readCString();
      this.value = stream.readCString();
    } else {
      this.scheme_id_uri = stream.readCString();
      this.value = stream.readCString();
      this.timescale = stream.readUint32();
      this.presentation_time_delta = stream.readUint32();
      this.event_duration = stream.readUint32();
      this.id = stream.readUint32();
    }
    let message_size =
      this.size -
      this.hdr_size -
      (4 * 4 + (this.scheme_id_uri.length + 1) + (this.value.length + 1));
    if (this.version === 1) {
      message_size -= 4;
    }
    this.message_data = stream.readUint8Array(message_size);
  }

  /** @bundle writing/emsg.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    this.flags = 0;
    this.size =
      4 * 4 + this.message_data.length + (this.scheme_id_uri.length + 1) + (this.value.length + 1);
    this.writeHeader(stream);
    stream.writeCString(this.scheme_id_uri);
    stream.writeCString(this.value);
    stream.writeUint32(this.timescale);
    stream.writeUint32(this.presentation_time_delta);
    stream.writeUint32(this.event_duration);
    stream.writeUint32(this.id);
    stream.writeUint8Array(this.message_data);
  }
}
