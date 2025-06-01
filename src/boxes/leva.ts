import { Log } from '#//log';
import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

interface Level {
  padding_flag: number;
  track_ID: number;
  assignment_type: number;
  grouping_type: string;
  grouping_type_parameter: number;
  sub_track_id: number;
}

export class levaBox extends FullBox {
  static override readonly fourcc = 'leva' as const;
  box_name = 'LevelAssignmentBox' as const;

  levels: Array<Level>;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    const count = stream.readUint8();
    this.levels = [];
    for (let i = 0; i < count; i++) {
      const level = {} as Level;
      this.levels[i] = level;
      level.track_ID = stream.readUint32();
      const tmp_byte = stream.readUint8();
      level.padding_flag = tmp_byte >> 7;
      level.assignment_type = tmp_byte & 0x7f;
      switch (level.assignment_type) {
        case 0:
          level.grouping_type = stream.readString(4);
          break;
        case 1:
          level.grouping_type = stream.readString(4);
          level.grouping_type_parameter = stream.readUint32();
          break;
        case 2:
          break;
        case 3:
          break;
        case 4:
          level.sub_track_id = stream.readUint32();
          break;
        default:
          Log.warn('BoxParser', `Unknown level assignment type: ${level.assignment_type}`);
      }
    }
  }
}
