// ISO/IEC 14496-12:2022 Section 8.18.3 Entity to group box
BoxParser.createEntityToGroupCtor = function(type, name, parseMethod) {
    BoxParser[type+"Box"] = function(size) {
        BoxParser.FullBox.call(this, type, size, name);
    }
    BoxParser[type+"Box"].prototype = new BoxParser.FullBox();
    BoxParser[type+"Box"].prototype.parse = function(stream) {
        this.parseFullHeader(stream);
        if (parseMethod) {
            parseMethod.call(this, stream);
        } else {
            this.group_id = stream.readUint32();
            this.num_entities_in_group = stream.readUint32();
            this.entity_ids = [];
            for (i = 0; i < this.num_entities_in_group; i++) {
                var entity_id = stream.readUint32();
                this.entity_ids.push(entity_id);
            }
        }
    };
};

// Auto exposure bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.2.1)
BoxParser.createEntityToGroupCtor("aebr", "Auto exposure bracketing");

// Flash exposure information (ISO/IEC 23008-12:2022 Section 6.8.6.5.1)
BoxParser.createEntityToGroupCtor("afbr", "Flash exposure information");

// Album collection (ISO/IEC 23008-12:2022 Section 6.8.7.1)
BoxParser.createEntityToGroupCtor("albc", "Album collection");

// Alternative entity (ISO/IEC 14496-12:2022 Section 8.18.3.1)
BoxParser.createEntityToGroupCtor("altr", "Alternative entity");

// Burst image (ISO/IEC 23008-12:2022 Section 6.8.2.2)
BoxParser.createEntityToGroupCtor("brst", "Burst image");

// Depth of field bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.6.1)
BoxParser.createEntityToGroupCtor("dobr", "Depth of field bracketing");

// Equivalent entity (ISO/IEC 23008-12:2022 Section 6.8.1.1)
BoxParser.createEntityToGroupCtor("eqiv", "Equivalent entity");

// Favourites collection (ISO/IEC 23008-12:2022 Section 6.8.7.2)
BoxParser.createEntityToGroupCtor("favc", "Favorites collection");

// Focus bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.4.1)
BoxParser.createEntityToGroupCtor("fobr", "Focus bracketing");

// Audio to image (ISO/IEC 23008-12:2022 Section 6.8.4)
BoxParser.createEntityToGroupCtor("iaug", "Image item with an audio track");

// Panorama (ISO/IEC 23008-12:2022 Section 6.8.8.1)
BoxParser.createEntityToGroupCtor("pano", "Panorama");

// Slideshow (ISO/IEC 23008-12:2022 Section 6.8.9.1)
BoxParser.createEntityToGroupCtor("slid", "Slideshow");

// Stereo pair (ISO/IEC 23008-12:2022 Section 6.8.5)
BoxParser.createEntityToGroupCtor("ster", "Stereo");

// Time-synchronised capture (ISO/IEC 23008-12:2022 Section 6.8.3)
BoxParser.createEntityToGroupCtor("tsyn", "Time-synchronized capture");

// White balance bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.3.1)
BoxParser.createEntityToGroupCtor("wbbr", "White balance bracketing");

// Progressive rendering (ISO/IEC 23008-12:2022 AMD1 Section 6.8.10)
BoxParser.createEntityToGroupCtor("prgr", "Progressive rendering");

// Image Pyramid (ISO/IEC 23008-12:20xx Section 6.8.11)
BoxParser.createEntityToGroupCtor("pymd", "Image pyramid", function(stream) {
    this.group_id = stream.readUint32();
    this.num_entities_in_group = stream.readUint32();
    this.entity_ids = [];
    for (var i = 0; i < this.num_entities_in_group; i++) {
        var entity_id = stream.readUint32();
        this.entity_ids.push(entity_id);
    }
    
    this.tile_size_x = stream.readUint16();
    this.tile_size_y = stream.readUint16();
    this.layer_binning = [];
    this.tiles_in_layer_column_minus1 = [];
    this.tiles_in_layer_row_minus1 = [];
    for (i = 0; i < this.num_entities_in_group; i++) {
        this.layer_binning[i] = stream.readUint16();
        this.tiles_in_layer_row_minus1[i] = stream.readUint16();
        this.tiles_in_layer_column_minus1[i] = stream.readUint16();
    }
});

