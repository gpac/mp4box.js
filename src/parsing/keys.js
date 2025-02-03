/*
 * The QTFF keys Atom is typically in a meta Box.
 * https://developer.apple.com/documentation/quicktime-file-format/metadata_item_keys_atom
 * key indexes are 1-based and so we store them in a Object, not an array..
 */
BoxParser.createFullBoxCtor("keys", function(stream) {
  this.count = stream.readUint32();
  this.keys = {};
  for (var i = 0; i < this.count; i++) {
    var len = stream.readUint32();
    this.keys[i + 1] = stream.readString(len - 4);
  }
});

