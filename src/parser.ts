import type { MultiBufferStream } from '#/buffer';
import type { BoxFourCC, IncompleteBox } from '@types';
import { Log } from '#/log';
import { ERR_INVALID_DATA, ERR_NOT_ENOUGH_DATA, OK } from '#/constants';
import { Box } from '#/box';
import { BoxRegistry } from '#/registry';

export function parseUUID(stream: MultiBufferStream) {
  return parseHex16(stream);
}

export function parseHex16(stream: MultiBufferStream) {
  let hex16 = '';
  for (let i = 0; i < 16; i++) {
    const hex = stream.readUint8().toString(16);
    hex16 += hex.length === 1 ? '0' + hex : hex;
  }
  return hex16;
}

export function parseOneBox(
  stream: MultiBufferStream,
  headerOnly: boolean,
  parentSize?: number,
): IncompleteBox {
  let box: Box;
  let originalSize: number;
  const start = stream.getPosition();
  let hdr_size = 0;
  let uuid: string;
  if (stream.getEndPosition() - start < 8) {
    Log.debug('BoxParser', 'Not enough data in stream to parse the type and size of the box');
    return { code: ERR_NOT_ENOUGH_DATA };
  }
  if (parentSize && parentSize < 8) {
    Log.debug('BoxParser', 'Not enough bytes left in the parent box to parse a new box');
    return { code: ERR_NOT_ENOUGH_DATA };
  }
  let size = stream.readUint32();
  const type = stream.readString(4);

  // Check if type is a valid fourcc
  if (type.length !== 4 || !/^[\x20-\x7E]{4}$/.test(type)) {
    Log.error('BoxParser', `Invalid box type: '${type}'`);
    return { code: ERR_INVALID_DATA, start, type };
  }

  let box_type = type;
  Log.debug(
    'BoxParser',
    "Found box of type '" + type + "' and size " + size + ' at position ' + start,
  );
  hdr_size = 8;
  if (type === 'uuid') {
    if (stream.getEndPosition() - stream.getPosition() < 16 || parentSize - hdr_size < 16) {
      stream.seek(start);
      Log.debug('BoxParser', 'Not enough bytes left in the parent box to parse a UUID box');
      return { code: ERR_NOT_ENOUGH_DATA };
    }
    uuid = parseUUID(stream);
    hdr_size += 16;
    box_type = uuid;
  }
  if (size === 1) {
    if (
      stream.getEndPosition() - stream.getPosition() < 8 ||
      (parentSize && parentSize - hdr_size < 8)
    ) {
      stream.seek(start);
      Log.warn(
        'BoxParser',
        'Not enough data in stream to parse the extended size of the "' + type + '" box',
      );
      return { code: ERR_NOT_ENOUGH_DATA };
    }
    originalSize = size;
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
        box = new Box(size);
        box.type = type as BoxFourCC;
        return { code: OK, box, size: box.size };
      }
    }
  }
  if (size !== 0 && size < hdr_size) {
    Log.error(
      'BoxParser',
      'Box of type ' + type + ' has an invalid size ' + size + ' (too small to be a box)',
    );
    return {
      code: ERR_NOT_ENOUGH_DATA,
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
      code: ERR_NOT_ENOUGH_DATA,
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
      code: ERR_NOT_ENOUGH_DATA,
      type: type,
      size: size,
      hdr_size: hdr_size,
      start: start,
      original_size: originalSize,
    };
  }
  if (headerOnly) {
    return { code: OK, type: type, size: size, hdr_size: hdr_size, start: start };
  } else {
    if (type in BoxRegistry.box) {
      box = new BoxRegistry.box[type](size);
    } else {
      if (type !== 'uuid') {
        Log.warn('BoxParser', `Unknown box type: '${type}'`);
        box = new Box(size);
        box.type = type as BoxFourCC;
        box.has_unparsed_data = true;
      } else {
        if (uuid in BoxRegistry.uuid) {
          box = new BoxRegistry.uuid[uuid](size);
        } else {
          Log.warn('BoxParser', `Unknown UUID box type: '${uuid}'`);
          box = new Box(size);
          box.type = type as BoxFourCC;
          box.uuid = uuid;
          box.has_unparsed_data = true;
        }
      }
    }
  }
  box.original_size = originalSize;
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
  const diff = stream.getPosition() - (box.start + box.size);
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
  } else if (diff > 0 && box.size !== 0) {
    Log.error(
      'BoxParser',
      "Parsing of box '" +
        box_type +
        "' read " +
        diff +
        ' more bytes than the indicated box data size, seeking backwards',
    );
    stream.seek(box.start + box.size);
  }
  return { code: OK, box, size: box.size };
}
