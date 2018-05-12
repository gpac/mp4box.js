var Log = require("./log.js").Log;
var ISOFile = require('./isofile.js').ISOFile;
var DataStream = require('./DataStream.js').DataStream;

ISOFile.prototype.items = [];
/* size of the buffers allocated for samples */
ISOFile.prototype.itemsDataSize = 0;

ISOFile.prototype.flattenItemInfo = function() {	
	var items = this.items;
	var i, j;
	var item;
	var meta = this.meta;
	if (meta === null || meta === undefined) return;
	if (meta.hdlr === undefined) return;
	if (meta.iinf === undefined) return;
	for (i = 0; i < meta.iinf.item_infos.length; i++) {
		item = {};
		item.id = meta.iinf.item_infos[i].item_ID;
		items[item.id] = item;
		item.ref_to = [];
		item.name = meta.iinf.item_infos[i].item_name;
		if (meta.iinf.item_infos[i].protection_index > 0) {
			item.protection = meta.ipro.protections[meta.iinf.item_infos[i].protection_index-1];
		}
		if (meta.iinf.item_infos[i].item_type) {
			item.type = meta.iinf.item_infos[i].item_type;
		} else {
			item.type = "mime";
		}
		item.content_type = meta.iinf.item_infos[i].content_type;
		item.content_encoding = meta.iinf.item_infos[i].content_encoding;
	}
	if (meta.iloc) {
		for(i = 0; i < meta.iloc.items.length; i++) {
			var offset;
			var itemloc = meta.iloc.items[i];
			item = items[itemloc.item_ID];
			if (itemloc.data_reference_index !== 0) {
				Log.warn("Item storage with reference to other files: not supported");
				item.source = meta.dinf.boxes[itemloc.data_reference_index-1];
			}
			if (itemloc.construction_method !== undefined) {
				Log.warn("Item storage with construction_method : not supported");
				switch(itemloc.construction_method) {
					case 0: // offset into the file referenced by the data reference index
					break;
					case 1: // offset into the idat box of this meta box
					break;
					case 2: // offset into another item
					break;
				}
			} else {
				item.extents = [];
				item.size = 0;
				for (j = 0; j < itemloc.extents.length; j++) {
					item.extents[j] = {};
					item.extents[j].offset = itemloc.extents[j].extent_offset + itemloc.base_offset;
					item.extents[j].length = itemloc.extents[j].extent_length;
					item.extents[j].alreadyRead = 0;
					item.size += item.extents[j].length;
				}
			}
		}
	}
	if (meta.pitm) {
		items[meta.pitm.item_id].primary = true;
	}
	if (meta.iref) {
		for (i=0; i <meta.iref.references.length; i++) {
			var ref = meta.iref.references[i];
			for (j=0; j<ref.references.length; j++) {
				items[ref.from_item_ID].ref_to.push({type: ref.type, id: ref.references[j]});
			}
		}
	}
}

ISOFile.prototype.getItem = function(item_id) {	
	var buffer;
	var item;
	
	if (!this.meta) {
		return null;
	}

 	item = this.items[item_id];
	if (!item.data && item.size) {
		/* Not yet fetched */
		item.data = new Uint8Array(item.size);
		item.alreadyRead = 0;
		this.itemsDataSize += item.size;
		Log.debug("ISOFile", "Allocating item #"+item_id+" of size "+item.size+" (total: "+this.itemsDataSize+")");
	} else if (item.alreadyRead === item.size) {
		/* Already fetched entirely */
		return item;
	}

	/* The item has only been partially fetched, we need to check in all buffers to find the remaining extents*/
	
	for (var i = 0; i < item.extents.length; i++) {
		var extent = item.extents[i];
		if (extent.alreadyRead === extent.length) {
			continue;
		} else {
			var index =	this.stream.findPosition(true, extent.offset + extent.alreadyRead, false);
			if (index > -1) {
				buffer = this.stream.buffers[index];
				var lengthAfterStart = buffer.byteLength - (extent.offset + extent.alreadyRead - buffer.fileStart);
				if (extent.length - extent.alreadyRead <= lengthAfterStart) {
					/* the (rest of the) extent is entirely contained in this buffer */

					Log.debug("ISOFile","Getting item #"+item_id+" extent #"+i+" data (alreadyRead: "+extent.alreadyRead+
						" offset: "+(extent.offset+extent.alreadyRead - buffer.fileStart)+" read size: "+(extent.length - extent.alreadyRead)+
						" full extent size: "+extent.length+" full item size: "+item.size+")");

					DataStream.memcpy(item.data.buffer, item.alreadyRead, 
					                  buffer, extent.offset+extent.alreadyRead - buffer.fileStart, extent.length - extent.alreadyRead);

					/* update the number of bytes used in this buffer and check if it needs to be removed */
					buffer.usedBytes += extent.length - extent.alreadyRead;
					this.stream.logBufferLevel();

					extent.alreadyRead = extent.length;
					item.alreadyRead += extent.length;
				} else {
					/* the sample does not end in this buffer */				
					
					Log.debug("ISOFile","Getting item #"+item_id+" extent #"+i+" partial data (alreadyRead: "+extent.alreadyRead+" offset: "+
						(extent.offset+extent.alreadyRead - buffer.fileStart)+" read size: "+lengthAfterStart+
						" full extent size: "+extent.length+" full item size: "+item.size+")");
					
					DataStream.memcpy(item.data.buffer, item.alreadyRead, 
					                  buffer, extent.offset+extent.alreadyRead - buffer.fileStart, lengthAfterStart);
					extent.alreadyRead += lengthAfterStart;
					item.alreadyRead += lengthAfterStart;

					/* update the number of bytes used in this buffer and check if it needs to be removed */
					buffer.usedBytes += lengthAfterStart;
					this.stream.logBufferLevel();
					return null;
				}
			} else {
				return null;
			}
		}
	}
	if (item.alreadyRead === item.size) {
		/* fetched entirely */
		return item;
	} else {
		return null;
	}
}

/* Release the memory used to store the data of the item */
ISOFile.prototype.releaseItem = function(item_id) {	
	var item = this.items[item_id];
	if (item.data) {
		this.itemsDataSize -= item.size;
		item.data = null;
		item.alreadyRead = 0;
		for (var i = 0; i < item.extents.length; i++) {
			var extent = item.extents[i];
			extent.alreadyRead = 0;
		}
		return item.size;
	} else {
		return 0;
	}
}


ISOFile.prototype.processItems = function(callback) {
	for(var i in this.items) {
		var item = this.items[i];
		this.getItem(item.id);
		if (callback && !item.sent) {
			callback(item);
			item.sent = true;
			item.data = null;
		}
	}
}

ISOFile.prototype.hasItem = function(name) {
	for(var i in this.items) {
		var item = this.items[i];
		if (item.name === name) {
			return item.id;
		}
	}
	return -1;
}

ISOFile.prototype.getMetaHandler = function() {
	if (!this.meta) {
		return null;
	} else {
		return this.meta.hdlr.handler;		
	}
}

ISOFile.prototype.getPrimaryItem = function() {
	if (!this.meta || !this.meta.pitm) {
		return null;
	} else {
		return this.getItem(this.meta.pitm.item_id);
	}
}

