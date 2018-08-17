function getFancyTreeDataFromDescChildren(descs) {
	var array = [];
	for (var i = 0; i < descs.length; i++) {
		var fancytree_node = getFancyTreeDataFromDesc(descs[i])[0];
		array.push(fancytree_node);
	}
	return array;
}

function getFancyTreeDataFromDesc(desc) {
	var array = [];
	var fancytree_node = {};
	array.push(fancytree_node);
	var parser = new MPEG4DescriptorParser();
	fancytree_node.title = parser.getDescriptorName(desc.tag);
	fancytree_node.data = { 'box': desc };
	fancytree_node.folder = true;
	fancytree_node.children = getFancyTreeDataFromDescChildren(desc.descs);
	return array;
}

function getFancyTreeDataFromBoxes(boxes) {
	var array = [];
	for (var i = 0; i < boxes.length; i++) {
		var box = boxes[i];
		var fancytree_node = {};
		array.push(fancytree_node);
		fancytree_node.title = box.type || i;
		fancytree_node.data = { 'box': box };
		var child_prop_names = [ "boxes", "entries", "references", "subsamples",
								 "items", "item_infos", "extents", "associations", "subsegments", "ranges", "seekLists", "seekPoints", "esd", "levels"];
		for (var j = 0; j < child_prop_names.length; j++) {
			var name = child_prop_names[j];
			if (box[name]) {
				fancytree_node.folder = true;
				if (name === "esd") {
					fancytree_node.children = getFancyTreeDataFromDesc(box[name]);
				} else {
					fancytree_node.children = getFancyTreeDataFromBoxes(box[name]);
				}
			}
		}
	}
	return array;
}