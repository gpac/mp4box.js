import type { NaluArray } from '@types';

export class NALUArrays extends Array<NaluArray> {
  toString() {
    let str = "<table class='inner-table'>";
    str += '<thead><tr><th>completeness</th><th>nalu_type</th><th>nalu_data</th></tr></thead>';
    str += '<tbody>';

    for (let i = 0; i < this.length; i++) {
      const nalu_array = this[i];
      str += '<tr>';
      str += "<td rowspan='" + nalu_array.length + "'>" + nalu_array.completeness + '</td>';
      str += "<td rowspan='" + nalu_array.length + "'>" + nalu_array.nalu_type + '</td>';
      for (let j = 0; j < nalu_array.length; j++) {
        const nalu = nalu_array[j];
        if (j !== 0) {
          str += '<tr>';
        }
        str += '<td>';
        str += nalu.data.reduce(function (str, byte) {
          return str + byte.toString(16).padStart(2, '0');
        }, '0x');
        str += '</td></tr>';
      }
    }
    str += '</tbody></table>';
    return str;
  }
}
