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
			{ url: "http://bellard.org/bpg/lena_q36.bpg", desc: "Lena (from BPG Web Site, QP36)"},
			{ url: "http://bellard.org/bpg/003.bpg", desc: "003 (from BPG Web Site)"},
			{ url: "http://bellard.org/bpg/005.bpg", desc: "003 (from BPG Web Site)"},
		]
	},
	{ 
		groupName: "HEVC MP4",
		urls: [
			{ url: "http://download.tsi.telecom-paristech.fr/gpac/dataset/dash/uhd/mux_sources/hevcds_720p30_2M.mp4", desc: "4EVER Video (720p, 8-bit)"},
			{ url: "http://download.tsi.telecom-paristech.fr/gpac/dataset/dash/uhd/mux_sources/hevcds_1080p30_4M.mp4", desc: "4EVER Video (1080p, 8-bit)"},
			{ url: "http://download.tsi.telecom-paristech.fr/gpac/dataset/dash/uhd/mux_sources/hevcds_1080p60_Main10_8M.mp4", desc: "4EVER Video (1080p, 10-bit)"},
			{ url: "http://download.tsi.telecom-paristech.fr/gpac/dataset/dash/uhd/mux_sources/hevcds_2160p60_12M.mp4", desc: "4EVER Video (2160p, 8-bit)"},
			{ url: "http://download.tsi.telecom-paristech.fr/gpac/dataset/dash/uhd/mux_sources/hevcds_2160p60_Main10_20M.mp4", desc: "4EVER Video (2160p, 10-bit)"},			
		]
	},
	{ 
		groupName: "Internal Testing",
		urls: [
			{ url: "./mp4/hevc/140626_720p_hm130_4s_sao_dbf_qp27.mp4", desc: "Elecard Video 1 (720p)"},
			{ url: "./mp4/hevc/140626_1080p_hm130_4s_sao_dbf_qp27.mp4", desc: "Elecard Video 1 (1080p)"},
			{ url: "./mp4/hevc/140803_720p_hm130_4s_sao_dbf_qp27.mp4", desc: "Elecard Video 2 (720p)"},
			{ url: "./mp4/hevc/art_of_flight_cu16_I_P_B_hvc1.mp4", desc: "Ateme video (720p)"},
			{ url: "./mp4/hevc/ED.mp4", desc: "Manga, single-frame (720p)"},
			{ url: "./mp4/hevc/Elemental.mp4", desc: "Elemental, Fox Sport 1 (720p)"},
			{ url: "./mp4/hevc/harmonic.mp4", desc: "Harmonic, Fox Sport 1 (720p)"},
			{ url: "./mp4/hevc/KaS.mp4", desc: "KaS (720p)"},
			{ url: "./mp4/hevc/spreedmovie.mp4", desc: "Spreed Movie (360p)"},
			{ url: "./mp4/hevc/surfing.mp4", desc: "Surfing Movie (720p)"},
			{ url: "./mp4/hevc/59.94fps_Stags_4K_UHD_14mbps_hvc1.mp4", desc: "Elemental (4K)"},
			{ url: "./mp4/hevc/Elecard_4K_video.mp4", desc: "Elecard (4K)"},
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
