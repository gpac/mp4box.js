/*
 * Copyright (c) 2025. Paul Higgs
 * License: BSD-3-Clause (see LICENSE file)
 */

export type DescriberFunction = (n: number) => string;

export class DescribedValue {
  private value: number;
  private description: string;

  constructor(value: number, descriptionFn?: DescriberFunction) {
    this.value = value;
    this.description = descriptionFn ? descriptionFn(value) : null;
  }
  toString() {
    return this.value + (this.description ? ' (' + this.description + ')' : '');
  }
  get() {
    return this.value;
  }
}

export class HexadecimalValue {
  private value: number;
  private description: string;

  constructor(value: number, descriptionFn?: DescriberFunction) {
    this.value = value;
    this.description = descriptionFn ? descriptionFn(value) : null;
  }
  toString() {
    return '0x' + this.value.toString(16) + (this.description ? ' (' + this.description + ')' : '');
  }
  get() {
    return this.value;
  }
}

export class BinaryValue {
  private value: number;
  private bits: number;
  private description: string;

  constructor(value: number, bits: number, descriptionFn?: DescriberFunction) {
    this.value = value;
    this.bits = bits;
    this.description = descriptionFn ? descriptionFn(value) : null;
  }
  toString() {
    let res = 'b';
    for (let i = this.bits; i > 0; i--) res += this.value & (1 << (i - 1)) ? '1' : '0';
    return res + (this.description ? ' (' + this.description + ')' : '');
  }
  public get() {
    return this.value;
  }
}

export class BooleanValue {
  private value: boolean;

  constructor(value: boolean | number) {
    this.value = typeof value === 'number' ? value > 0 : value;
  }
  toString() {
    return `${this.value ? 1 : 0} (${this.value ? 'true' : 'false'})`;
  }
  public get() {
    return this.value;
  }
}

export class AVS3data {
  toHTML(data: object): string {
    let res = '';
    const props = Object.getOwnPropertyNames(data);
    if (props)
      props.forEach(function (val) {
        let fmt_val = '';
        if (Array.isArray(data[val])) {
          for (let i = 0; i < data[val].length; i++) {
            const hex = data[val][i].toString(16);
            fmt_val += hex.length === 1 ? '0' + hex : hex;
            if (i % 4 === 3) fmt_val += ' ';
          }
        } else fmt_val = data[val];
        res += '<tr><td><code>' + val + '</code></td><td><code>' + fmt_val + '</code></td></tr>';
      });
    return '<table>' + res + '</table>';
  }
}
