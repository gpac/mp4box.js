/*
 * Copyright (c) 2025. Paul Higgs
 * License: BSD-3-Clause (see LICENSE file)
 */

export type DescriberFunction = (n: number) => string;

export class DescribedValue {
  private _value: number;
  private _description: string;

  constructor(value: number, descriptionFn?: DescriberFunction) {
    this._value = value;
    this._description = descriptionFn ? descriptionFn(value) : undefined;
  }
  toString() {
    return `${this.value}${this._description && this._description.length > 0 ? ' (' + this._description + ')' : ''}`;
  }
  get value(): number {
    return this._value;
  }
}

export class HexadecimalValue {
  private _value: number;
  private _description: string;

  constructor(value: number, descriptionFn?: DescriberFunction) {
    this._value = value;
    this._description = descriptionFn ? descriptionFn(value) : undefined;
  }
  toString() {
    return `0x${this._value.toString(16)}${this._description && this._description.length > 0 ? ' (' + this._description + ')' : ''}`;
  }
  get value(): number {
    return this._value;
  }
}

export class BinaryValue {
  private _value: number;
  private _bits: number;
  private _description: string;

  constructor(value: number, bits: number, descriptionFn?: DescriberFunction) {
    this._value = value;
    this._bits = bits;
    this._description = descriptionFn ? descriptionFn(value) : undefined;
  }
  toString() {
    let res = 'b';
    for (let i = this._bits; i > 0; i--) res += this._value & (1 << (i - 1)) ? '1' : '0';
    return (
      res +
      (this._description && this._description.length > 0 ? ' (' + this._description + ')' : '')
    );
  }
  get value(): number {
    return this._value;
  }
}

export class BooleanValue {
  private _value: boolean;

  constructor(value: boolean | number) {
    this._value = typeof value === 'number' ? value > 0 : value;
  }
  toString() {
    return `${this._value ? 1 : 0} (${this._value ? 'true' : 'false'})`;
  }
  get value(): boolean {
    return this._value;
  }
}

export class AVS3data {
  /* not currently used to beautify output 
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
        res += `<tr><td><code>${val}</code></td><td><code>${fmt_val}</code></td></tr>`;
      });
    return `<table>${res}</table>`;
  } */

  toString(data: object): string {
    let res = '';
    const props = Object.getOwnPropertyNames(data);
    props.forEach(function (val) {
      let fmt_val = '';
      if (Array.isArray(data[val])) {
        for (let i = 0; i < data[val].length; i++) {
          const hex = data[val][i].toString(16);
          fmt_val += hex.length === 1 ? '0' + hex : hex;
          if (i % 4 === 3) fmt_val += ' ';
        }
      } else fmt_val = data[val];
      res += `${val}: ${fmt_val}\n`;
    });
    return res;
  }
}
