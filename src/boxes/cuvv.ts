/*
 * Copyright (c) 2025. Paul Higgs
 * License: BSD-3-Clause (see LICENSE file)
 */

import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

class VersionMap16 {
  bitmap: number;

  constructor(bitmap: number) {
    this.bitmap = bitmap;
  }

  toString() {
    const versions: Array<number> = [];
    for (let i = 0; i < 16; i++) {
      if (this.bitmap && 1 << i) {
        versions.push(i + 1);
      }
    }
    return versions.length === 0 ? 'none' : versions.join(' ');
  }
}

class HighVersion {
  val: number;

  constructor(val: number) {
    this.val = val;
  }

  toString() {
    // table 5 in TUWA 005-2.1
    switch (this.val) {
      case 0x0005:
        return '1.0';
      case 0x0006:
        return '2.0';
      case 0x0007:
        return '3.0';
      case 0x0008:
        return '4.0';
    }
    return 'unknown';
  }
}

export class cuvvBox extends Box {
  static override readonly fourcc = 'cuvv' as const;
  box_name = 'CUVVConfigurationBox' as const;

  cuva_version_map: VersionMap16;
  terminal_provide_code: number;
  terminal_provide_oriented_code: HighVersion;
  reserved_zero: Array<number>;

  parse(stream: MultiBufferStream) {
    this.cuva_version_map = new VersionMap16(stream.readUint16());
    this.terminal_provide_code = stream.readUint16(); // should be 0x0004

    // according to T/UWA 005.2-1, this element contains the 'highest version in the current ES'
    this.terminal_provide_oriented_code = new HighVersion(stream.readUint16());
    this.reserved_zero = [];
    for (let i = 0; i < 4; i++) {
      this.reserved_zero.push(stream.readUint32());
    }
  }
}
