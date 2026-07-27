import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class alttBox extends FullBox {
  static override readonly fourcc = 'altt' as const;
  box_name = 'AccessibilityTextProperty' as const;

  alt_text: string;
  alt_lang: string;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.alt_text = stream.readCString();
    this.alt_lang = stream.readCString();
  }
}
