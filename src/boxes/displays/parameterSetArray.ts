import type { Nalu } from '@types';

export class ParameterSetArray extends Array<Nalu> {
  toString() {
    let str = "<table class='inner-table'>";
    str += '<thead><tr><th>length</th><th>nalu_data</th></tr></thead>';
    str += '<tbody>';

    for (let i = 0; i < this.length; i++) {
      const nalu = this[i];
      str += '<tr>';
      str += '<td>' + nalu.length + '</td>';
      str += '<td>';
      str += nalu.data.reduce(function (str, byte) {
        return str + byte.toString(16).padStart(2, '0');
      }, '0x');
      str += '</td></tr>';
    }
    str += '</tbody></table>';
    return str;
  }
}
