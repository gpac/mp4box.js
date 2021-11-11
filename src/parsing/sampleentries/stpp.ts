export default (BoxParser: any) => {
  BoxParser.createSampleEntryCtor(
    BoxParser.SAMPLE_ENTRY_TYPE_SUBTITLE,
    'stpp',
    function (this: any, stream: any) {
      this.parseHeader(stream);
      this.namespace = stream.readCString();
      this.schema_location = stream.readCString();
      this.auxiliary_mime_types = stream.readCString();
      this.parseFooter(stream);
    }
  );
};
