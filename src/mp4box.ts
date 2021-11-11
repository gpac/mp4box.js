import { ISOFile } from './isofile';
export * from './audio';
export * from './box';
export * from './buffer';
export * from './DataStream';
export * from './descriptor';
export * from './isofile';
export * from './log';
export * from './stream';
export * from './types';

export class MP4Box {
  public static createFile(_keepMdatData: boolean, steam: any) {
    var keepMdatData = _keepMdatData !== undefined ? _keepMdatData : true;
    const file = new ISOFile(steam);
    file.discardMdatData = !keepMdatData;
    return file;
  }
}
