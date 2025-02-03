/*
 * The QTFF ilst Box typically follows a keys Box within a meta Box.
 * https://developer.apple.com/documentation/quicktime-file-format/metadata_item_list_atom
 */
BoxParser.createBoxCtor("ilst", function(stream) {
  var total = this.size - this.hdr_size;
  this.boxes = { };
  while (total > 0) {
    var size = stream.readUint32();

    /* The index into the keys box */
    var index = stream.readUint32();
    var res = BoxParser.parseOneBox(stream, false, size - 8);
    if (res.code == BoxParser.OK)
      this.boxes[index] = res.box;
    total -= size;
  }
});
