var testFiles = [
	{ // 0
		desc: "non-fragmented MP4 file with single MPEG-AVC stream",
		url: './mp4/h264bl.mp4',
		info_: {"duration":360000,"timescale":600,"isFragmented":false,"isProgressive":true,"hasIOD":true,"brands":["isom","isom"],"created":new Date("2014-04-10T18:23:58.000Z"),"modified":new Date("2014-04-10T18:23:58.000Z"),"tracks":[{"id":1,"references":[],"created":new Date("2012-02-13T23:07:31.000Z"),"modified":new Date("2014-04-10T18:23:59.000Z"),"movie_duration":360000,"layer":0,"alternate_group":0,"volume":0,"matrix":{"0":65536,"1":0,"2":0,"3":0,"4":65536,"5":0,"6":0,"7":0,"8":1073741824},"track_width":320,"track_height":180,"timescale":25000,"duration":15000000,"codec":"avc1.42c00d","language":"und","nb_samples":15000,"video":{"width":320,"height":180}}],"audioTracks":[],"videoTracks":[{"id":1,"references":[],"created":new Date("2012-02-13T23:07:31.000Z"),"modified":new Date("2014-04-10T18:23:59.000Z"),"movie_duration":360000,"layer":0,"alternate_group":0,"volume":0,"matrix":{"0":65536,"1":0,"2":0,"3":0,"4":65536,"5":0,"6":0,"7":0,"8":1073741824},"track_width":320,"track_height":180,"timescale":25000,"duration":15000000,"codec":"avc1.42c00d","language":"und","nb_samples":15000,"video":{"width":320,"height":180}}],"subtitleTracks":[],"metadataTracks":[],"hintTracks":[]},
	},
	{ // 1
		desc: "fragmented  MP4 file with single MPEG-AVC stream",
		url: './mp4/a.mp4'
	},
	{ // 2
		desc: "non-fragmented MP4 file with MPEG-4 AAC stream",
		url: './mp4/aaclow.mp4'
	},
	{ // 3
		desc: "non-fragmented MP4 file with two AVC video streams",
		url: './mp4/2v.mp4'
	},
	{ // 4
		desc: "non-fragmented MP4 file with AVC, AAC and WebVTT",
		url: './mp4/avw.mp4'
	},
	{ // 5
		desc: "non-fragmented MP4 file with 1 WebVTT stream",
		url: './mp4/subtitle-srt-wvtt.mp4'
	},
	{ // 6
		desc: "non-fragmented MP4 file with 1 text:tx3g stream",
		url: './mp4/subtitle-srt-tx3g.mp4'
	},
	{ // 7
		desc: "non-fragmented MP4 file with 1 text:stse stream",
		url: './mp4/anim-svg.mp4'
	},
	{ // 8
		desc: "non-fragmented MP4 file with 1 subt:stpp stream",
		url: './mp4/subtitle-ttml-stpp.mp4'
	},
	{ // 9
		desc: "non-fragmented MP4 file with single AVC stream, moov is last box",
		url: './mp4/moov_last.mp4'
	},
	{ // 10
		desc: "long movie",
		url: './mp4/Bad.Influence.se4ep13.mp4'
		//url: './mp4-torrents/g.mp4'
	},
	{ // 11
		desc: "Incomplete file from torrent",
		url: './mp4-torrents/as2-incomplete.mp4'
	}
];