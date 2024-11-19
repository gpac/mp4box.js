import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';
import { Log } from '../log';

export class infeBox extends FullBox {
  item_ID?: number;
  item_protection_index?: number;
  item_name?: unknown;
  content_type?: unknown;
  content_encoding?: unknown;
  extension_type?: string;
  item_type?: string;
  item_uri_type?: unknown;

  constructor(size?: number) {
    super('infe', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.version === 0 || this.version === 1) {
      this.item_ID = stream.readUint16();
      this.item_protection_index = stream.readUint16();
      this.item_name = stream.readCString();
      this.content_type = stream.readCString();
      this.content_encoding = stream.readCString();
    }
    if (this.version === 1) {
      this.extension_type = stream.readString(4);
      Log.warn('BoxParser', 'Cannot parse extension type');
      stream.seek(this.start + this.size);
      return;
    }
    if (this.version >= 2) {
      if (this.version === 2) {
        this.item_ID = stream.readUint16();
      } else if (this.version === 3) {
        this.item_ID = stream.readUint32();
      }
      this.item_protection_index = stream.readUint16();
      this.item_type = stream.readString(4);
      this.item_name = stream.readCString();
      if (this.item_type === 'mime') {
        this.content_type = stream.readCString();
        this.content_encoding = stream.readCString();
      } else if (this.item_type === 'uri ') {
        this.item_uri_type = stream.readCString();
      }
    }
  }
}
