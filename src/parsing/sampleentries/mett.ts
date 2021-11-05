export default (BoxParser: any) => {
  BoxParser.createSampleEntryCtor(
    BoxParser.SAMPLE_ENTRY_TYPE_METADATA,
    'mett',
    function (this: any, stream: any) {
      this.parseHeader(stream);
      this.content_encoding = stream.readCString();
      this.mime_format = stream.readCString();
      this.parseFooter(stream);
    }
  );
};
