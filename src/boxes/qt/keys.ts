import { FullBox } from "#/box";
import type { MultiBufferStream } from '#/buffer';

/*
 * The QTFF keys Atom is typically in a meta Box.
 * https://developer.apple.com/documentation/quicktime-file-format/metadata_item_keys_atom
 * key indexes are 1-based and so we store them in a Object, not an array.
 */
export class keysBox extends FullBox {
  type = 'keys' as const;
  box_name = 'KeysBox';

  count: number;
  keys: Record<number, string>;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.count = stream.readUint32();
    this.keys = {};
    for (let i = 0; i < this.count; i++) {
      const len = stream.readUint32();
      this.keys[i + 1] = stream.readString(len - 4);
    }
  }
}
