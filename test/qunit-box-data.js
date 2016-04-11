var boxtests = [
	{
		url: mediaTestBaseUrl + "mp4/box/sidx.mp4",
		rangeStart: 0,
		rangeSize: 36,
		boxname: "ftyp",
		data: {
			type: "ftyp",
			size: 36,
			major_brand: "iso5",
			minor_version: 1,
			compatible_brands: [ "avc1", "iso5", "dsms", "msix", "dash"]
		}
	},
	{ 
		url: mediaTestBaseUrl + "mp4/box/sidx.mp4",	
		rangeStart: 1566,
		rangeSize: 152,
		boxname: "sidx",
		data: {
			type: "sidx",
			size: 152,
			flags: 0,
			version: 0,
			reference_ID: 1,
			timescale: 24,
			earliest_presentation_time: 0,
			first_offset: 0,
			references: [
				{ 
					reference_type: 0,
					referenced_size: 776279,
					subsegment_duration: 224,
					starts_with_SAP: 1,
					SAP_type: 1,
					SAP_delta_time: 0
				},
				{ 
					reference_type: 0,
					referenced_size: 298018,
					subsegment_duration: 110,
					starts_with_SAP: 1,
					SAP_type: 1,
					SAP_delta_time: 0
				},
				{ 
					reference_type: 0,
					referenced_size: 151055,
					subsegment_duration: 62,
					starts_with_SAP: 1,
					SAP_type: 1,
					SAP_delta_time: 0
				},
				{ 
					reference_type: 0,
					referenced_size: 583055,
					subsegment_duration: 130,
					starts_with_SAP: 1,
					SAP_type: 1,
					SAP_delta_time: 0
				},
				{ 
					reference_type: 0,
					referenced_size: 310294,
					subsegment_duration: 45,
					starts_with_SAP: 1,
					SAP_type: 1,
					SAP_delta_time: 0
				},
				{ 
					reference_type: 0,
					referenced_size: 353217,
					subsegment_duration: 50,
					starts_with_SAP: 1,
					SAP_type: 1,
					SAP_delta_time: 0
				},
				{ 
					reference_type: 0,
					referenced_size: 229078,
					subsegment_duration: 37,
					starts_with_SAP: 1,
					SAP_type: 1,
					SAP_delta_time: 0
				},
				{ 
					reference_type: 0,
					referenced_size: 685457,
					subsegment_duration: 114,
					starts_with_SAP: 1,
					SAP_type: 1,
					SAP_delta_time: 0
				},
				{ 
					reference_type: 0,
					referenced_size: 746586,
					subsegment_duration: 250,
					starts_with_SAP: 1,
					SAP_type: 1,
					SAP_delta_time: 0
				},
				{ 
					reference_type: 0,
					referenced_size: 228474,
					subsegment_duration: 231,
					starts_with_SAP: 1,
					SAP_type: 1,
					SAP_delta_time: 0
				}
			]
		}
	},
	{
		url: mediaTestBaseUrl + "mp4/box/emsg.m4s",
		rangeStart: 106,
		rangeSize: 494,
		boxname: "emsg",
		data: {
			type: "emsg",
			size: 494,
			flags:	0,
			version:	0,
			scheme_id_uri:	"urn:mpeg:dash:event:2012",
			value:	"advert",
			timescale:	1,
			presentation_time_delta:	1,
			event_duration:	1,
			id:	1							
		}
	}
];
