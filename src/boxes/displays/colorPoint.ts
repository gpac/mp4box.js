export class ColorPoint {
  constructor(public x: number, public y: number) {}
  toString() {
    return '(' + this.x + ',' + this.y + ')';
  }
}
