export default (BoxParser: any) => {
  BoxParser.createSampleEntryCtor(
    BoxParser.SAMPLE_ENTRY_TYPE_METADATA,
    'wvtt',
    function (this: any, stream: any) {
      this.parseHeader(stream);
      this.parseFooter(stream);
    }
  );
};
