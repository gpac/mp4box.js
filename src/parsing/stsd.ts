import { FullBox, SampleEntry } from '../box';
import { BoxParser } from '../box-parser';
import { MultiBufferStream } from '../buffer';
import { Log } from '../log';

export class stsdBox extends FullBox {
  entries?: Array<SampleEntry>;

  constructor(size?: number) {
    super('stsd', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    let box: SampleEntry;
    this.entries = [];
    const entryCount = stream.readUint32();
    for (let i = 1; i <= entryCount; i++) {
      let ret = BoxParser.parseOneBox(
        stream,
        true,
        this.size - (stream.getPosition() - this.start),
      );
      if (ret.code === BoxParser.OK) {
        if (BoxParser[ret.type + 'SampleEntry']) {
          box = new BoxParser[ret.type + 'SampleEntry'](ret.size);
          box.hdr_size = ret.hdr_size;
          box.start = ret.start;
        } else {
          Log.warn('BoxParser', 'Unknown sample entry type: ' + ret.type);
          box = new BoxParser.SampleEntry(ret.type, ret.size, ret.hdr_size, ret.start);
        }
        if (box.write === BoxParser.SampleEntry.prototype.write) {
          Log.info(
            'BoxParser',
            'SampleEntry ' +
              box.type +
              ' box writing not yet implemented, keeping unparsed data in memory for later write',
          );
          box.parseDataAndRewind(stream);
        }
        box.parse(stream);
        this.entries.push(box);
      } else {
        return;
      }
    }
  }

  /** @bundle writing/stsd.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    this.flags = 0;
    this.size = 0;
    this.writeHeader(stream);
    stream.writeUint32(this.entries.length);
    this.size += 4;
    for (let i = 0; i < this.entries.length; i++) {
      this.entries[i].write(stream);
      this.size += this.entries[i].size;
    }
    /* adjusting the size, now that all sub-boxes are known */
    Log.debug('BoxWriter', 'Adjusting box ' + this.type + ' with new size ' + this.size);
    stream.adjustUint32(this.sizePosition, this.size);
  }
}
