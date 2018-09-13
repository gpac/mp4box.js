
function generateBoxTable(box, excluded_fields, additional_props, no_header) {
	var prop;
	var html = '<table>';
	if (!no_header) {
		html += '<thead>';
		html += '<tr>';
		html += '<th>';
		html += 'Property name';
		html += '</th>';
		html += '<th>';
		html += 'Property value';
		html += '</th>';
		html += '</tr>';
		html += '</thead>';
	}
	html += '<tbody>';
	for (prop in box) {
		if (["hdr_size", "boxes", "subBoxNames", "entries", "samples", "references", "items", "item_infos", "extents", "associations", "esd", "descs", "levels", "subsegments"].indexOf(prop) > -1) {
			continue;
		} else if (excluded_fields && excluded_fields.indexOf(prop) > -1) {
			continue;
		} else if (box[prop] instanceof BoxParser.Box) {
			continue;
		} else if (typeof box[prop] === "undefined") {
			continue;
		} else if (typeof box[prop] === "function") {
			continue;
		} else if (box.subBoxNames && box.subBoxNames.indexOf(prop.slice(0,4)) > -1) {
			continue;
		} else {
			html += '<tr>';
			html += '<td><code>';
			html += prop;
			html += '</code></td>';
			html += '<td><code>';
			if (prop === "data") {
				for (var i = 0; i < box[prop].length; i++) {
					var j = box[prop][i];
					var hex = j.toString(16);
					html += (hex.length === 1 ? "0"+hex : hex);
					if (i%4 === 3) html += ' ';
				}
			} else {
				html += box[prop];
			}
			html += '</code></td>';
			html += '</tr>';
		}
	}
	if (additional_props) {
		for (prop in additional_props) {
			html += '<tr>';
			html += '<td><code>';
			html += prop;
			html += '</code></td>';
			html += '<td><code>';
			html += additional_props[prop];
			html += '</code></td>';
			html += '</tr>';
		}
	}
	html += '</tbody>';
	html += '</table>';
	return html;
}