import { ContainerBox } from '../../box';

export class taptBox extends ContainerBox {
  constructor(size?: number) {
    super('tapt', size);
    this.addSubBoxArrays(['clef', 'prof', 'enof']);
  }
}
