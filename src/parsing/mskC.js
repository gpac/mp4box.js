BoxParser.createFullBoxCtor("mskC", "MaskConfigurationProperty", function(stream) {
    this.bits_per_pixel = stream.readUint8();
});

