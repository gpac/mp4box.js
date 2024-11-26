function VersionMap16(bitmap) {
	this.bitmap = bitmap;
}
VersionMap16.prototype.toString = function () {
    var i, versions = [];
    for (i=0; i<16; i++)
        if (this.bitmap &  (2, i))
            versions.push(i+1);
    return versions.length ===0 ? "none" : versions.join(" ");
}
function HighVersion(val) {
	this.val = val;
}
VersHighVersionionMap16.prototype.toString = function () {
    // table 5 in T/UWA 005-2.1
    switch (this.val) {
        case 0x0005: return "1.0";
        case 0x0006: return "2.0";
        case 0x0007: return "3.0";
        case 0x0008: return "4.0";
    }
    return "unknown";
}

BoxParser.createBoxCtor("cuvv", function(stream) {
    var i, reserved_zero;
    this.cuva_version_map = new VersionMap16(stream.readUint16());

    this.terminal_provide_code =  stream.readUint16();  // should be 0x0004

    // according to T/UWA 005.2-1, this element contains the 'highest version in the current ES'
    this.terminal_provide_oriented_code =  new HighVersion(stream.readUint16()); 
    for (i=0; i<4; i++)
        reserved_zero = stream.readUint32();
});