var sampleUrls = [
	{ 
		groupName: "BPG Images",
		urls: [
			{ url: "./bpg/4ever.bpg", desc: "Extract from the 4EVER UHD HEVC Dataset"},
		]
	},
	{ 
		groupName: "BPG Images (require disabling CORS)",
		urls: [
			{ url: "http://hubimg.com/x/vid/homepage_v03.mp4", desc: "From BPG Web Site"},
		]
	},
	{ 
		groupName: "HEVC MP4",
		urls: [
			{ url: "./mp4/a.mp4", desc: "4EVER Video"},
		]
	},
	{ 
		groupName: "HEVC MP4 (require disabling CORS)",
		urls: [
			{ url: "./mp4/2v.mp4", desc: "Elemental"},
		]
	},
];

function buildUrlList(urlSelector, addNonPlayable) {
	for (var i in sampleUrls) {
		var group = document.createElement("optgroup");
		group.label = sampleUrls[i].groupName;
		urlSelector.appendChild(group);
		for (var j in sampleUrls[i].urls) {
			if (addNonPlayable || sampleUrls[i].urls[j].playable === undefined || sampleUrls[i].urls[j].playable) {
				group.appendChild(new Option(sampleUrls[i].urls[j].desc, sampleUrls[i].urls[j].url));
			}
		}
	}
}	
