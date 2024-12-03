import { Box, Descriptor, MPEG4DescriptorParser } from 'mp4box';

interface FancyTreeData {
  title: string | number;
  data: { box: Descriptor | Box };
  folder?: boolean;
  children?: Array<FancyTreeData>;
}

function getFancyTreeDataFromDescChildren(descs: Array<Descriptor>) {
  var array = [];
  for (var i = 0; i < descs.length; i++) {
    var fancytree_node = getFancyTreeDataFromDesc(descs[i])[0];
    array.push(fancytree_node);
  }
  return array;
}

function getFancyTreeDataFromDesc(desc: Descriptor): Array<FancyTreeData> {
  var parser = new MPEG4DescriptorParser();
  return [
    {
      title: parser.getDescriptorName(desc.tag),
      data: { box: desc },
      folder: true,
      children: getFancyTreeDataFromDescChildren(desc.descs),
    },
  ];
}

export function getFancyTreeDataFromBoxes(boxes: Array<Box>) {
  var array = [];
  for (var i = 0; i < boxes.length; i++) {
    var box = boxes[i];
    var fancytree_node: FancyTreeData = {
      title: box.type || i,
      data: { box: box },
    };
    array.push(fancytree_node);
    var child_prop_names = [
      'boxes',
      'entries',
      'references',
      'subsamples',
      'items',
      'item_infos',
      'extents',
      'associations',
      'subsegments',
      'ranges',
      'seekLists',
      'seekPoints',
      'esd',
      'levels',
      'props',
    ];
    for (var j = 0; j < child_prop_names.length; j++) {
      var name = child_prop_names[j];
      if (name in box) {
        fancytree_node.folder = true;
        if (name === 'esd') {
          fancytree_node.children = getFancyTreeDataFromDesc(box[name]);
        } else {
          fancytree_node.children = getFancyTreeDataFromBoxes(box[name]);
        }
      }
    }
  }
  return array;
}
