export class Pixel {
  constructor(public bad_pixel_row: number, public bad_pixel_column: number) {}
  toString() {
    return '[row: ' + this.bad_pixel_row + ', column: ' + this.bad_pixel_column + ']';
  }
}
