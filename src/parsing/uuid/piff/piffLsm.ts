export default (BoxParser: any) => {
  BoxParser.createUUIDbox(
    'a5d40b30e81411ddba2f0800200c9a66',
    true,
    false,
    function (this: any, stream: any) {
      this.LiveServerManifest = stream
        .readString(this.size - this.hdr_size)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  );
};
