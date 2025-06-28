import { Box } from '#/box';
import { OK } from '#/constants';
import { parseOneBox } from '#/parser';
import type { MultiBufferStream } from '#/buffer';

/*
 * The QTFF ilst Box typically follows a keys Box within a meta Box.
 * https://developer.apple.com/documentation/quicktime-file-format/metadata_item_list_atom
 */

export class ilstBox extends Box {
  static override readonly fourcc = 'ilst' as const;
  box_name = 'IlstBox' as const;

  /* Indexed by the index in keys */
  list: Record<number, Box>;

  parse(stream: MultiBufferStream) {
    this.list = {};
    let total = this.size - this.hdr_size;
    while (total > 0) {
      const size = stream.readUint32();

      /* The index into the keys box */
      const index = stream.readUint32();

      const res = parseOneBox(stream, false, size - 8);
      if (res.code === OK) this.list[index] = res.box;
      total -= size;
    }
  }
}
