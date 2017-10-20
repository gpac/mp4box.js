var sampleUrls = [
	{ 
		groupName: "Non-fragmented files",
		urls: [
			{ url: "./mp4/h264bl.mp4", desc: "Video Counter (10min, unfragmented, AVC Baseline)"},
			{ url: "./mp4/aaclow.mp4", desc: "Audio Bips (10 min, unfragmented, AAC)"},
			{ url: "./mp4/avw.mp4", desc: "Multiplexed Audio/Video/Subtitle (unfragmented, AVC+AAC+WebVTT)"},
			{ url: "./mp4/Bad.Influence.se4ep13.mp4", desc: "Bad Influence (S04E13 from Archive.org, 20 min, unfragmented, AVC+AAC, 117MB)"},
			{ url: "http://storage.googleapis.com/peer5_vod/sintel-2048-surround.mp4", desc: "Sintel (from Peer5, 15 min, non-fragmented, non-progressive, 310MB)"},
			{ url: "http://akamai-progressive.irt.de/irt_subs/webvtt/nick.mp4", desc: "Nick and the roundabouts (from IRT, 5 min, non-fragmented, WebVTT in MP4, 77MB)"},
			{ url: "./mp4/counter_french.mp4", desc: "MP3 in MP4"},
			{ url: "./mp4/sintel-1024-surround.mp4", desc: "Sintel 1024 Surround"},
		]
	},
	{ 
		groupName: "Non-fragmented files (require disabling CORS)",
		urls: [
			{ url: "https://a0.muscache.com/airbnb/static/Paris-P1-1.mp4", desc: "AirBnB Paris video"},
			{ url: "http://hubimg.com/x/vid/homepage_v03.mp4", desc: "HubPages video"},
			{ url: "http://v.theonion.com/onionmedia/videos/videometa/2002/zen_mp4.mp4", desc: "The Onion video"},
			{ url: "http://content.jwplatform.com/videos/HkauGhRi-640.mp4", desc: "JWPlayer video"},
		]
	},
	{ 
		groupName: "Fragmented files",
		urls: [
			{ url: "./mp4/a.mp4", desc: "Video Counter (10min, fragmented, AVC Baseline)"},
			{ url: "http://download.tsi.telecom-paristech.fr/gpac/DASH_CONFORMANCE/TelecomParisTech/mp4-onDemand/mp4-onDemand-aaclc_high.mp4", desc: "DASH onDemand audio (fragmented, AAC High)"},
			{ url: "http://download.tsi.telecom-paristech.fr/gpac/DASH_CONFORMANCE/TelecomParisTech/mp4-onDemand/mp4-onDemand-aaclc_low.mp4", desc: "DASH onDemand audio (fragmented, AAC Low)"},
			{ url: "http://download.tsi.telecom-paristech.fr/gpac/DASH_CONFORMANCE/TelecomParisTech/mp4-onDemand/mp4-onDemand-h264bl_full.mp4", desc: "DASH onDemand video (fragmented, H.264/AVC Baseline Full HD)"},
			{ url: "http://download.tsi.telecom-paristech.fr/gpac/DASH_CONFORMANCE/TelecomParisTech/mp4-onDemand/mp4-onDemand-h264bl_low.mp4", desc: "DASH onDemand video (fragmented, H.264/AVC Baseline Low Resolution)"},
			{ url: "https://storage.googleapis.com/media-session/flac.mp4", desc: "FLAC in ISO-BMFF"}
		]
	},
	{ 
		groupName: "Multi-track files (require track selection)",
		urls: [
			{ url: "./mp4/2v.mp4", desc: "2 videos (unfragmented, AVC+AVC)"},
			{ url: "./mp4/text/text-all.mp4", desc: "All text formats (unfragmented)"},
			{ url: "./mp4/bbb_sunflower_1080p_30fps_normal.mp4", desc: "Big Buck Bunny (10 min, unfragmented, AVC+AAC+AC3, 263 MB)"},
		]
	},
	{ 
		groupName: "Synchronized Graphics Experiments",
		urls: [
			{ url: "./mp4/ancient-sun.mp4", desc: "Audio with background, beat and lyrics overlays"},
			{ url: "./mp4/helloProcessing.mp4", desc: "Video with 2D graphical overlays"},
			{ url: "./mp4/helloTeaser.mp4", desc: "Video with 3D graphical overlays"},
		]
	},
	{ 
		groupName: "Packaging Web Resources",
		urls: [
			{ url: "./mp4/video-with-html.mp4", desc: "Video with HTML/CSS items"},
			{ url: "./mp4/Anand-Carlsen2014.mp4", desc: "Video with many web assets (JS, CSS, PNG, WebVTT)"},
		]
	},
	{ 
		groupName: "HTML 5 Track Kinds",
		urls: [
			{ url: "./mp4/html5-kind/video-kind-alternative.mp4", desc: "Video with alternative kind"},
			{ url: "./mp4/html5-kind/video-kind-captions.mp4", desc: "Video with captions kind"},
			{ url: "./mp4/html5-kind/video-kind-main.mp4", desc: "Video with main kind"},
			{ url: "./mp4/html5-kind/video-kind-sign.mp4", desc: "Video with sign kind"},
			{ url: "./mp4/html5-kind/video-kind-subtitles.mp4", desc: "Video with subtitles kind"},
			{ url: "./mp4/html5-kind/video-kind-commmentary.mp4", desc: "Video with commentary kind"},
			{ url: "./mp4/html5-kind/video-kind-empty.mp4", desc: "Video with no kind"},
			{ url: "./mp4/html5-kind/audio-kind-alternative.mp4", desc: "Audio with alternative kind"},
			{ url: "./mp4/html5-kind/audio-kind-descriptions.mp4", desc: "Audio with descriptions kind"},
			{ url: "./mp4/html5-kind/audio-kind-main.mp4", desc: "Audio with main kind"},
			{ url: "./mp4/html5-kind/audio-kind-main-desc.mp4", desc: "Audio with main-desc kind"},
			{ url: "./mp4/html5-kind/audio-kind-translation.mp4", desc: "Audio with translation kind"},
			{ url: "./mp4/html5-kind/audio-kind-commentary.mp4", desc: "Audio with commentary kind"},
			{ url: "./mp4/html5-kind/audio-kind-empty.mp4", desc: "Audio with empty kind"},
		]
	},
	{ 
		groupName: "For Internal Testing",
		urls: [
			{ url: "./mp4/meta/meta-file-single-item.mp4", desc: "Basic 'meta' test", playable: false },
			{ url: "./mp4/meta/meta-file-single-primary.mp4", desc: "Basic 'meta' test w/ primary item", playable: false },
			{ url: "./mp4/Bad.Influence.se4ep13.video.flat.mp4", desc: "Bad Influence (video only, flat storage)"},
			{ url: "./mp4/Bad.Influence.se4ep13.flat.mp4", desc: "Bad Influence (A/V flat storage)"},
			{ url: "./mp4-torrents/g.mp4", desc: "Gravity v1 (1h30, unfragmented, AVC video only, 3.28 GB)"},
			{ url: "./mp4-torrents/Gravity%202013.mp4", desc: "Gravity v1 (1h30, unfragmented, AVC+AAC, 3.48 GB)"},
			{ url: "./mp4-torrents/Gravity.mp4", desc: "Gravity v2 (1h30, unfragmented, AVC+AAC+AC3, 2.72 GB)"},
			{ url: "./mp4-torrents/Iron%20Man%202008.720p.BrRip.x264.YIFY.mp4", desc: "Iron Man (2h06, unfragmented, AVC+AAC, 749 MB)"},
			{ url: "./mp4-torrents/Iron.man.2DAZA.mp4", desc: "Iron Man 2 (2h, unfragmented, AVC+AAC+AC3, 1.5 GB)"},
			{ url: "./mp4-torrents/Iron.Man.3.2013.720p.BluRay.x264.YIFY.mp4", desc: "Iron Man 3 (2h10, unfragmented, AVC+AAC, 925 MB)"},
			{ url: "./mp4-torrents/the%20wolf%20of%20wall%20street%20esp%20castellano%20dvds%202013.MP4", desc: "The Wolf of Wall Street v1 (3h, unfragmented, AVC+AAC(esp),1.02 GB)"},
			{ url: "./mp4-torrents/The%20Wolf%20of%20Wall%20Street.mp4", desc: "The Wolf of Wall Street v2 (3h, unfragmented, AVC+AAC+AC3, 7.08 GB)"},
			{ url: "./mp4-torrents/WolfVideo.mp4", desc: "The Wolf of Wall Street v2 (3h, fragmented, AVC only, 6.14 GB)"},
			{ url: "./uvvu/Solekai002_1280_23_1x1_v7clear.uvu", desc: "Solekai002_1280_23_1x1_v7clear.uvu"},
			{ url: "./uvvu/Solekai003_1920_23_1x1_v7clear.uvu", desc: "Solekai003_1920_23_1x1_v7clear.uvu"},
			{ url: "./uvvu/Solekai004_640_23_1x1_v7clear.uvu", desc: "Solekai004_640_23_1x1_v7clear.uvu"},
			{ url: "./uvvu/Solekai005_854_23_1x1_v7clear.uvu", desc: "Solekai005_854_23_1x1_v7clear.uvu"},
			{ url: "./uvvu/Solekai006_640_29_1x1_v7clear.uvu", desc: "Solekai006_640_29_1x1_v7clear.uvu"},
			{ url: "./uvvu/Solekai007_1920_29_1x1_v7clear.uvu", desc: "Solekai007_1920_29_1x1_v7clear.uvu"},
			{ url: "./uvvu/Solekai008_1280_29_1x1_v7clear.uvu", desc: "Solekai008_1280_29_1x1_v7clear.uvu"},
			{ url: "./uvvu/Solekai009_1280_59_1x1_v7clear.uvu", desc: "Solekai009_1280_59_1x1_v7clear.uvu"},
			{ url: "./uvvu/Solekai010_640_59_464x75_v7clear.uvu", desc: "Solekai010_640_59_464x75_v7clear.uvu"},
			{ url: "./uvvu/Solekai015_1920_29_75x75_v7clear.uvu", desc: "Solekai015_1920_29_75x75_v7clear.uvu"},
			{ url: "./uvvu/Solekai018_1920_23_1x1_v7clear.uvu", desc: "Solekai018_1920_23_1x1_v7clear.uvu"},
			{ url: "./uvvu/Solekai022_854_29_640x75_MaxSdSubtitle_v7clear.uvu", desc: "Solekai022_854_29_640x75_MaxSdSubtitle_v7clear.uvu"},
			{ url: "./uvvu/Solekai023_1920_23_1x1_MaxHdSubtitle_v7clear.uvu", desc: "Solekai023_1920_23_1x1_MaxHdSubtitle_v7clear.uvu"},
			{ url: "./uvvu/Solekai024_854_59_426x75_Non-standard_boxes_v7clear.uvu", desc: "Solekai024_854_59_426x75_Non-standard_boxes_v7clear.uvu"},
			{ url: "./uvvu/Solekai031_640_23_1x1_Max_Audio_v7clear.uvu", desc: "Solekai031_640_23_1x1_Max_Audio_v7clear.uvu"},
			{ url: "./uvvu/Solekai032_MaxNumSubtitleTracks_v7clear.uvu", desc: "Solekai032_MaxNumSubtitleTracks_v7clear.uvu"},
			{ url: "./uvvu/Solekai034_854x350_23_1x1_v7clear.uvu", desc: "Solekai034_854x350_23_1x1_v7clear.uvu"},
			{ url: "./uvvu/Solekai035_950x1080_23_1x1_v7clear.uvu", desc: "Solekai035_950x1080_23_1x1_v7clear.uvu"},
			{ url: "./uvvu/Solekai040_640x480_25_11x12_v7clear.uvu", desc: "Solekai040_640x480_25_11x12_v7clear.uvu"},
			{ url: "./uvvu/Solekai041_854x480_50_426x75_v7clear.uvu", desc: "Solekai041_854x480_50_426x75_v7clear.uvu"},
			{ url: "./uvvu/Solekai042_1280x720_50_75x1_v7clear.uvu", desc: "Solekai042_1280x720_50_75x1_v7clear.uvu"},
			{ url: "./uvvu/Solekai043_1920x1080_25_5x75_v7clear.uvu", desc: "Solekai043_1920x1080_25_5x75_v7clear.uvu"},
			{ url: "./uvvu/Solekai044_640_23_1x1_Sync_Subs_Txt_SD_v7clear.uvu", desc: "Solekai044_640_23_1x1_Sync_Subs_Txt_SD_v7clear.uvu"},
			{ url: "./uvvu/Solekai045_1920_23_1x1_Sync_Subs_Txt_HD_v7clear.uvu", desc: "Solekai045_1920_23_1x1_Sync_Subs_Txt_HD_v7clear.uvu"},
			{ url: "./uvvu/Solekai046_640_23_1x1_Sync_Subs_Img_SD_v7clear.uvu", desc: "Solekai046_640_23_1x1_Sync_Subs_Img_SD_v7clear.uvu"},
			{ url: "./uvvu/Solekai047_1920_23_1x1_Sync_Subs_Img_HD_v7clear.uvu", desc: "Solekai047_1920_23_1x1_Sync_Subs_Img_HD_v7clear.uvu"},
			{ url: "./uvvu/Solekai049_854_23_426x75_Sync_Subs_Txt_SD_v7clear.uvu", desc: "Solekai049_854_23_426x75_Sync_Subs_Txt_SD_v7clear.uvu"},
			{ url: "./uvvu/Solekai050_854_23_426x75_Sync_Subs_Img_SD_v7clear.uvu", desc: "Solekai050_854_23_426x75_Sync_Subs_Img_SD_v7clear.uvu"},
			{ url: "./uvvu/Solekai051_1920_23_5x75_Sync_Subs_Txt_HD_v7clear.uvu", desc: "Solekai051_1920_23_5x75_Sync_Subs_Txt_HD_v7clear.uvu"},
			{ url: "./uvvu/Solekai052_1920_23_5x75_Sync_Subs_Img_HD_v7clear.uvu", desc: "Solekai052_1920_23_5x75_Sync_Subs_Img_HD_v7clear.uvu"},
			{ url: "./uvvu/Solekai055_640_23_1x1_TimeReps_SD_v7clear.uvu", desc: "Solekai055_640_23_1x1_TimeReps_SD_v7clear.uvu"},
			{ url: "./uvvu/Solekai060_854_23_640x75_sync_v7clear.uvu", desc: "Solekai060_854_23_640x75_sync_v7clear.uvu"},
			{ url: "./uvvu/Solekai_track_selection013_v7.uvu", desc: "Solekai_track_selection013_v7.uvu"},
			{ url: "./uvvu/Solekai_track_selection018_v7.uvu", desc: "Solekai_track_selection018_v7.uvu"},
		]
	}
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
