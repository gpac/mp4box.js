var REFERENCE_TYPE_NAMES = {
	"auxl": "Auxiliary image item",
	"base": "Pre-derived image item base",
	"cdsc": "Item describes referenced item",
	"dimg": "Derived image item",
	"dpnd": "Item coding dependency",
	"eroi": "Region",
	"evir": "EVC slice",
	"exbl": "Scalable image item",
	"fdl": "File delivery",
	"font": "Font item",
	"iloc": "Item data location",
	"mask": "Region mask",
	"mint": "Data integrity",
	"pred": "Predictively coded item",
	"prem": "Pre-multiplied item",
	"tbas": "HEVC tile track base item",
	"thmb": "Thumbnail image item"
};

BoxParser.createFullBoxCtor("iref", "ItemReferenceBox", function(stream) {
	var ret;
	var entryCount;
	var box;
	this.references = [];

	while (stream.getPosition() < this.start+this.size) {
		ret = BoxParser.parseOneBox(stream, true, this.size - (stream.getPosition() - this.start));
		if (ret.code === BoxParser.OK) {
			var name = REFERENCE_TYPE_NAMES[ret.type];
			if (this.version === 0) {
				box = new BoxParser.SingleItemTypeReferenceBox(ret.type, ret.size, name, ret.hdr_size, ret.start);
			} else {
				box = new BoxParser.SingleItemTypeReferenceBoxLarge(ret.type, ret.size, name, ret.hdr_size, ret.start);
			}
			if (box.write === BoxParser.Box.prototype.write && box.type !== "mdat") {
				Log.warn("BoxParser", box.type+" box writing not yet implemented, keeping unparsed data in memory for later write");
				box.parseDataAndRewind(stream);
			}
			box.parse(stream);
			this.references.push(box);
		} else {
			return;
		}
	}
});
