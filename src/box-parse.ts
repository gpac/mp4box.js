import { Box } from './box';
import { BoxParser } from './box-parser';
import { MultiBufferStream } from './buffer';
import { Log } from './log';
import { MP4BoxStream } from './stream';

/** @bundle box-parse.js */
export function parseUUID(stream: MultiBufferStream) {
  return parseHex16(stream);
}

/** @bundle box-parse.js */
export function parseHex16(stream: MultiBufferStream) {
  let hex16 = '';
  for (let i = 0; i < 16; i++) {
    let hex = stream.readUint8().toString(16);
    hex16 += hex.length === 1 ? '0' + hex : hex;
  }
  return hex16;
}

/** @bundle box-parse.js */
export function parseOneBox(
  stream: MultiBufferStream | MP4BoxStream,
  headerOnly: boolean,
  parentSize?: number,
) {
  let box: Box;
  let start = stream.getPosition();
  let hdr_size = 0;
  let diff: string | number;
  let uuid: string;
  if (stream.getEndPosition() - start < 8) {
    Log.debug('BoxParser', 'Not enough data in stream to parse the type and size of the box');
    return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
  }
  if (parentSize && parentSize < 8) {
    Log.debug('BoxParser', 'Not enough bytes left in the parent box to parse a new box');
    return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
  }
  let size = stream.readUint32();
  let type = stream.readString(4);
  let box_type = type;
  Log.debug(
    'BoxParser',
    "Found box of type '" + type + "' and size " + size + ' at position ' + start,
  );
  hdr_size = 8;
  if (type == 'uuid') {
    if (stream.getEndPosition() - stream.getPosition() < 16 || parentSize - hdr_size < 16) {
      stream.seek(start);
      Log.debug('BoxParser', 'Not enough bytes left in the parent box to parse a UUID box');
      return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
    }
    uuid = parseUUID(stream);
    hdr_size += 16;
    box_type = uuid;
  }
  if (size == 1) {
    if (
      stream.getEndPosition() - stream.getPosition() < 8 ||
      (parentSize && parentSize - hdr_size < 8)
    ) {
      stream.seek(start);
      Log.warn(
        'BoxParser',
        'Not enough data in stream to parse the extended size of the "' + type + '" box',
      );
      return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
    }
    size = stream.readUint64();
    hdr_size += 8;
  } else if (size === 0) {
    /* box extends till the end of file or invalid file */
    if (parentSize) {
      size = parentSize;
    } else {
      /* box extends till the end of file */
      if (type !== 'mdat') {
        Log.error('BoxParser', "Unlimited box size not supported for type: '" + type + "'");
        box = new Box(type, size);
        return { code: BoxParser.OK, box: box, size: box.size };
      }
    }
  }
  if (size !== 0 && size < hdr_size) {
    Log.error(
      'BoxParser',
      'Box of type ' + type + ' has an invalid size ' + size + ' (too small to be a box)',
    );
    return {
      code: BoxParser.ERR_NOT_ENOUGH_DATA,
      type: type,
      size: size,
      hdr_size: hdr_size,
      start: start,
    };
  }
  if (size !== 0 && parentSize && size > parentSize) {
    Log.error(
      'BoxParser',
      "Box of type '" +
        type +
        "' has a size " +
        size +
        ' greater than its container size ' +
        parentSize,
    );
    return {
      code: BoxParser.ERR_NOT_ENOUGH_DATA,
      type: type,
      size: size,
      hdr_size: hdr_size,
      start: start,
    };
  }
  if (size !== 0 && start + size > stream.getEndPosition()) {
    stream.seek(start);
    Log.info('BoxParser', "Not enough data in stream to parse the entire '" + type + "' box");
    return {
      code: BoxParser.ERR_NOT_ENOUGH_DATA,
      type: type,
      size: size,
      hdr_size: hdr_size,
      start: start,
    };
  }
  if (headerOnly) {
    return { code: BoxParser.OK, type: type, size: size, hdr_size: hdr_size, start: start };
  } else {
    if (BoxParser[type + 'Box']) {
      box = new BoxParser[type + 'Box'](size);
    } else {
      if (type !== 'uuid') {
        Log.warn('BoxParser', "Unknown box type: '" + type + "'");
        box = new Box(type, size);
        box.has_unparsed_data = true;
      } else {
        if (BoxParser.UUIDBoxes[uuid]) {
          box = new BoxParser.UUIDBoxes[uuid](size);
        } else {
          Log.warn('BoxParser', "Unknown uuid type: '" + uuid + "'");
          box = new Box(type, size);
          box.uuid = uuid;
          box.has_unparsed_data = true;
        }
      }
    }
  }
  box.hdr_size = hdr_size;
  /* recording the position of the box in the input stream */
  box.start = start;
  if (box.write === Box.prototype.write && box.type !== 'mdat') {
    Log.info(
      'BoxParser',
      "'" +
        box_type +
        "' box writing not yet implemented, keeping unparsed data in memory for later write",
    );
    box.parseDataAndRewind(stream);
  }
  box.parse(stream);
  diff = stream.getPosition() - (box.start + box.size);
  if (diff < 0) {
    Log.warn(
      'BoxParser',
      "Parsing of box '" +
        box_type +
        "' did not read the entire indicated box data size (missing " +
        -diff +
        ' bytes), seeking forward',
    );
    stream.seek(box.start + box.size);
  } else if (diff > 0) {
    Log.error(
      'BoxParser',
      "Parsing of box '" +
        box_type +
        "' read " +
        diff +
        ' more bytes than the indicated box data size, seeking backwards',
    );
    if (box.size !== 0) stream.seek(box.start + box.size);
  }
  return { code: BoxParser.OK, box: box, size: box.size };
}
