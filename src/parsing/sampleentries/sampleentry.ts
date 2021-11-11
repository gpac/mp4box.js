export default (BoxParser: any) => {
  BoxParser.SAMPLE_ENTRY_TYPE_VISUAL = 'Visual';
  BoxParser.SAMPLE_ENTRY_TYPE_AUDIO = 'Audio';
  BoxParser.SAMPLE_ENTRY_TYPE_HINT = 'Hint';
  BoxParser.SAMPLE_ENTRY_TYPE_METADATA = 'Metadata';
  BoxParser.SAMPLE_ENTRY_TYPE_SUBTITLE = 'Subtitle';
  BoxParser.SAMPLE_ENTRY_TYPE_SYSTEM = 'System';
  BoxParser.SAMPLE_ENTRY_TYPE_TEXT = 'Text';

  // Base SampleEntry types with default parsing
  BoxParser.createMediaSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_HINT);
  BoxParser.createMediaSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_METADATA);
  BoxParser.createMediaSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_SUBTITLE);
  BoxParser.createMediaSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_SYSTEM);
  BoxParser.createMediaSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_TEXT);

  //Base SampleEntry types for Audio and Video with specific parsing
  BoxParser.createMediaSampleEntryCtor(
    BoxParser.SAMPLE_ENTRY_TYPE_VISUAL,
    function (this: any, stream: any) {
      var compressorname_length;
      this.parseHeader(stream);
      stream.readUint16();
      stream.readUint16();
      stream.readUint32Array(3);
      this.width = stream.readUint16();
      this.height = stream.readUint16();
      this.horizresolution = stream.readUint32();
      this.vertresolution = stream.readUint32();
      stream.readUint32();
      this.frame_count = stream.readUint16();
      compressorname_length = Math.min(31, stream.readUint8());
      this.compressorname = stream.readString(compressorname_length);
      if (compressorname_length < 31) {
        stream.readString(31 - compressorname_length);
      }
      this.depth = stream.readUint16();
      stream.readUint16();
      this.parseFooter(stream);
    }
  );

  BoxParser.createMediaSampleEntryCtor(
    BoxParser.SAMPLE_ENTRY_TYPE_AUDIO,
    function (this: any, stream: any) {
      this.parseHeader(stream);
      stream.readUint32Array(2);
      this.channel_count = stream.readUint16();
      this.samplesize = stream.readUint16();
      stream.readUint16();
      stream.readUint16();
      this.samplerate = stream.readUint32() / (1 << 16);
      this.parseFooter(stream);
    }
  );

  // Sample entries inheriting from Audio and Video
  BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_VISUAL, 'avc1');
  BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_VISUAL, 'avc2');
  BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_VISUAL, 'avc3');
  BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_VISUAL, 'avc4');
  BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_VISUAL, 'av01');
  BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_VISUAL, 'hvc1');
  BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_VISUAL, 'hev1');
  BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_AUDIO, 'mp4a');
  BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_AUDIO, 'ac-3');
  BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_AUDIO, 'ec-3');

  // Encrypted sample entries
  BoxParser.createEncryptedSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_VISUAL, 'encv');
  BoxParser.createEncryptedSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_AUDIO, 'enca');
  BoxParser.createEncryptedSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_SUBTITLE, 'encu');
  BoxParser.createEncryptedSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_SYSTEM, 'encs');
  BoxParser.createEncryptedSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_TEXT, 'enct');
  BoxParser.createEncryptedSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_METADATA, 'encm');
};
