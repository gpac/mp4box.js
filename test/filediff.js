var file_a = {};
file_a.mp4boxfile = null;
file_a.objectToLoad = null;
file_a.objectIsFile = false;
file_a.fancytree = null;

var file_b = {};
file_b.mp4boxfile = null;
file_b.objectToLoad = null;
file_b.objectIsFile = false;
file_b.fancytree = null;

Log.setLogLevel(Log.debug);

window.onload = function () {
	createLoadBar($('#menubar'), "File A", "fileA", file_a, finalizeDiffUI);
	createLoadBar($('#menubar'), "File B", "fileB", file_b, finalizeDiffUI);

	createFancyTree($('#resulttabs'), file_a);
	createFancyTree($('#resulttabs'), file_b);
}

function getFancyTreeDiffedDataFromBoxes(boxes, expected_boxes) {
	var j;
	var array = [];
	var expected_boxes_compared = [];
	if (expected_boxes) {
		for (j = 0; j < expected_boxes.length; j++) {
			expected_boxes_compared[j] = false;
		}
	}
	for (var i = 0; i < boxes.length; i++) {
		var box = boxes[i];
		var expected_box;
		if (expected_boxes) {
			for (j = 0; j < expected_boxes.length; j++) {
				if (expected_boxes[j].type === box.type && expected_boxes[j].uuid === box.uuid && !expected_boxes_compared[j]) {
					expected_box = expected_boxes[j];
					expected_boxes_compared[j] = true;
					break;
				}
			}
		}
		var fancytree_node = {};
		array.push(fancytree_node);
		fancytree_node.title = box.type || i;
		fancytree_node.data = { 'box': box };
		if (!expected_box || !BoxParser.boxEqualFields(box, expected_box)) {
			fancytree_node.extraClasses = 'fields_diff';
			array.diff = true;
		}
		var child_prop_names = [ "boxes", "entries", "references", "subsamples",
								 "items", "item_infos", "extents", "associations", "subsegments", "ranges", "seekLists", "seekPoints", "esd", "levels"];
		for (j = 0; j < child_prop_names.length; j++) {
			var name = child_prop_names[j];
			if (box[name]) {
				fancytree_node.folder = true;
				if (name === "esd") {
					fancytree_node.children = getFancyTreeDataFromDesc(box[name], expected_box ? expected_box[name] : expected_box);
				} else {
					fancytree_node.children = getFancyTreeDiffedDataFromBoxes(box[name], expected_box ? expected_box[name] : expected_box);
				}
				if (fancytree_node.children.diff) {
					if (fancytree_node.extraClasses !== 'fields_diff') {
						fancytree_node.extraClasses = 'children_diff';
					}
					array.diff = true;
				}
			}
		}
	}
	return array;
}

function finalizeDiffUI(fileobj, loadbutton, success) {
	loadbutton.button("enable");
	if (success) {

		if (file_a.mp4boxfile != null && file_b.mp4boxfile != null) {

			var treeboxes = getFancyTreeDiffedDataFromBoxes(file_a.mp4boxfile.boxes, file_b.mp4boxfile.boxes);
			file_a.fancytree.reload(treeboxes);

			treeboxes = getFancyTreeDiffedDataFromBoxes(file_b.mp4boxfile.boxes, file_a.mp4boxfile.boxes);
			file_b.fancytree.reload(treeboxes);

			if (file_a.mp4boxfile.equal(file_b.mp4boxfile)) {
				console.log("Files are equal");
			} else {
				console.log("Files are different");
			}
		}
	} else {
	}
}
