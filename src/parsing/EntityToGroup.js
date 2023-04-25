// ISO/IEC 14496-12:2022 Section 8.18.3 Entity to group box
BoxParser.createEntityToGroupCtor = function(type, parseMethod) {
    BoxParser[type+"Box"] = function(size) {
        BoxParser.FullBox.call(this, type, size);
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
BoxParser.createEntityToGroupCtor("aebr");

// Flash exposure bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.5.1)
BoxParser.createEntityToGroupCtor("afbr");

// Album collection (ISO/IEC 23008-12:2022 Section 6.8.7.1)
BoxParser.createEntityToGroupCtor("albc");

// Alternative entity (ISO/IEC 14496-12:2022 Section 8.18.3.1)
BoxParser.createEntityToGroupCtor("altr");

// Burst image entity group (ISO/IEC 23008-12:2022 Section 6.8.2.2)
BoxParser.createEntityToGroupCtor("brst");

// Depth of field bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.6.1)
BoxParser.createEntityToGroupCtor("dobr");

// Equivalent entity (ISO/IEC 23008-12:2022 Section 6.8.1.1)
BoxParser.createEntityToGroupCtor("eqiv");

// Favourites collection (ISO/IEC 23008-12:2022 Section 6.8.7.2)
BoxParser.createEntityToGroupCtor("favc");

// Focus bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.4.1)
BoxParser.createEntityToGroupCtor("fobr");

// Audio to image entity group (ISO/IEC 23008-12:2022 Section 6.8.4)
BoxParser.createEntityToGroupCtor("iaug");

// Panorama (ISO/IEC 23008-12:2022 Section 6.8.8.1)
BoxParser.createEntityToGroupCtor("pano");

// Slideshow (ISO/IEC 23008-12:2022 Section 6.8.9.1)
BoxParser.createEntityToGroupCtor("slid");

// Stereo pair (ISO/IEC 23008-12:2022 Section 6.8.5)
BoxParser.createEntityToGroupCtor("ster");

// Time-synchronised capture entity group (ISO/IEC 23008-12:2022 Section 6.8.3)
BoxParser.createEntityToGroupCtor("tsyn");

// White balance bracketing (ISO/IEC 23008-12:2022 Section 6.8.6.3.1)
BoxParser.createEntityToGroupCtor("wbbr");

// Alternative entity (ISO/IEC 23008-12:2022 AMD1 Section 6.8.10)
BoxParser.createEntityToGroupCtor("prgr");
