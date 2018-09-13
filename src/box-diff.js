
BoxParser.DIFF_BOXES_PROP_NAMES = [ "boxes", "entries", "references", "subsamples",
					 	 "items", "item_infos", "extents", "associations",
					 	 "subsegments", "ranges", "seekLists", "seekPoints",
					 	 "esd", "levels"];

BoxParser.DIFF_PRIMITIVE_ARRAY_PROP_NAMES = [ "compatible_brands", "matrix", "opcolor", "sample_counts", "sample_counts", "sample_deltas",
"first_chunk", "samples_per_chunk", "sample_sizes", "chunk_offsets", "sample_offsets", "sample_description_index", "sample_duration" ];

BoxParser.boxEqualFields = function(box_a, box_b) {
	if (box_a && !box_b) return false;
	var prop;
	for (prop in box_a) {
		if (BoxParser.DIFF_BOXES_PROP_NAMES.indexOf(prop) > -1) {
			continue;
		// } else if (excluded_fields && excluded_fields.indexOf(prop) > -1) {
		// 	continue;
		} else if (box_a[prop] instanceof BoxParser.Box || box_b[prop] instanceof BoxParser.Box) {
			continue;
		} else if (typeof box_a[prop] === "undefined" || typeof box_b[prop] === "undefined") {
			continue;
		} else if (typeof box_a[prop] === "function" || typeof box_b[prop] === "function") {
			continue;
		} else if (
			(box_a.subBoxNames && box_a.subBoxNames.indexOf(prop.slice(0,4)) > -1) ||
			(box_b.subBoxNames && box_b.subBoxNames.indexOf(prop.slice(0,4)) > -1))  {
			continue;
		} else {
			if (prop === "data" || prop === "start" || prop === "size" || prop === "creation_time" || prop === "modification_time") {
				continue;
			} else if (BoxParser.DIFF_PRIMITIVE_ARRAY_PROP_NAMES.indexOf(prop) > -1) {
				continue;
			} else {
				if (box_a[prop] !== box_b[prop]) {
					return false;
				}
			}
		}
	}
	return true;
}

BoxParser.boxEqual = function(box_a, box_b) {
	if (!BoxParser.boxEqualFields(box_a, box_b)) {
		return false;
	}
	for (var j = 0; j < BoxParser.DIFF_BOXES_PROP_NAMES.length; j++) {
		var name = BoxParser.DIFF_BOXES_PROP_NAMES[j];
		if (box_a[name] && box_b[name]) {
			if (!BoxParser.boxEqual(box_a[name], box_b[name])) {
				return false;
			}
		}
	}
	return true;
}