import { Log } from '../log';

export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('iref', function (this: any, stream: any) {
    var ret;

    var box;
    this.references = [];

    while (stream.getPosition() < this.start + this.size) {
      ret = BoxParser.parseOnebox(stream, true, this.size - (stream.getPosition() - this.start));
      if (ret.code === BoxParser.OK) {
        if (this.version === 0) {
          box = new BoxParser.SingleItemTypeReferenceBox(
            ret.type,
            ret.size,
            ret.hdr_size,
            ret.start
          );
        } else {
          box = new BoxParser.SingleItemTypeReferenceBoxLarge(
            ret.type,
            ret.size,
            ret.hdr_size,
            ret.start
          );
        }
        if (box.write === BoxParser.Box.prototype.write && box.type !== 'mdat') {
          Log.warn(
            'BoxParser',
            box.type +
              ' box writing not yet implemented, keeping unparsed data in memory for later write'
          );
          box.parseDataAndRewind(stream);
        }
        box.parse(stream);
        this.references.push(box);
      } else {
        return;
      }
    }
  });
};
