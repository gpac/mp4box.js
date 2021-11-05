import { Log } from '../../log';

export default (BoxParser: any) => {
  BoxParser.createSampleGroupCtor('stsa', function (this: any, stream: any) {
    Log.warn('BoxParser', 'Sample Group type: ' + this.grouping_type + ' not fully parsed');
  });
};
