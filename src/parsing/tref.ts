import { Log } from '../log';

export default (BoxParser: any) => {
  BoxParser.trefBox.prototype.parse = function (this: any, stream: any) {
    var ret;
    var box;
    while (stream.getPosition() < this.start + this.size) {
      ret = BoxParser.parseOnebox(stream, true, this.size - (stream.getPosition() - this.start));
      if (ret.code === BoxParser.OK) {
        box = new BoxParser.TrackReferenceTypeBox(ret.type, ret.size, ret.hdr_size, ret.start);
        if (box.write === BoxParser.Box.prototype.write && box.type !== 'mdat') {
          Log.info(
            'BoxParser',
            'TrackReference ' +
              box.type +
              ' box writing not yet implemented, keeping unparsed data in memory for later write'
          );
          box.parseDataAndRewind(stream);
        }
        box.parse(stream);
        this.boxes.push(box);
      } else {
        return;
      }
    }
  };
};
