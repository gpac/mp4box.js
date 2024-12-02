import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class dfLaBox extends FullBox {
  samplerate: number;
  numMetadataBlocks: string;

  type = 'dfLa' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    const BLOCKTYPE_MASK = 0x7f;
    const LASTMETADATABLOCKFLAG_MASK = 0x80;

    const boxesFound = [];
    const knownBlockTypes = [
      'STREAMINFO',
      'PADDING',
      'APPLICATION',
      'SEEKTABLE',
      'VORBIS_COMMENT',
      'CUESHEET',
      'PICTURE',
      'RESERVED',
    ];

    // for (i=0; ; i++) { // to end of box
    do {
      const flagAndType = stream.readUint8();

      const type = Math.min(flagAndType & BLOCKTYPE_MASK, knownBlockTypes.length - 1);

      // if this is a STREAMINFO block, read the true samplerate since this
      // can be different to the AudioSampleEntry samplerate.
      if (!type) {
        // read past all the other stuff
        stream.readUint8Array(13);

        // extract samplerate
        this.samplerate = stream.readUint32() >> 12;

        // read to end of STREAMINFO
        stream.readUint8Array(20);
      } else {
        // not interested in other block types so just discard length bytes
        stream.readUint8Array(stream.readUint24());
      }

      boxesFound.push(knownBlockTypes[type]);

      if (!!(flagAndType & LASTMETADATABLOCKFLAG_MASK)) {
        break;
      }
    } while (true);

    this.numMetadataBlocks = boxesFound.length + ' (' + boxesFound.join(', ') + ')';
  }
}
