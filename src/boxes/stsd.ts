import { FullBox, SampleEntry, parseOneBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { OK } from '#/constants';
import { Log } from '#/log';
import { BoxRegistry } from '#/registry';

export class stsdBox extends FullBox {
  entries: Array<SampleEntry>;

  type = 'stsd' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.entries = [];

    const entryCount = stream.readUint32();

    for (let i = 1; i <= entryCount; i++) {
      let ret = parseOneBox(stream, true, this.size - (stream.getPosition() - this.start));

      if (ret.code === OK) {
        let box: SampleEntry;
        if (`${ret.type}SampleEntry` in BoxRegistry) {
          box = new BoxRegistry[`${ret.type}SampleEntry`](ret.size);
          box.hdr_size = ret.hdr_size;
          box.start = ret.start;
        } else {
          Log.warn('BoxParser', 'Unknown sample entry type: ' + ret.type);
          // @ts-expect-error FIXME: incorrect signature
          box = new SampleEntry(ret.type, ret.size, ret.hdr_size, ret.start);
        }

        // TODO: something funky
        if (box.write === SampleEntry.prototype.write) {
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
