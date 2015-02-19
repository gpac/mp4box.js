MP4Box.js
======

[![Build Status](https://travis-ci.org/gpac/mp4box.js.svg?branch=master)](https://travis-ci.org/gpac/mp4box.js)

JavaScript library to process MP4 files in the browser, with support for progressive parsing. 
Inspired by the [MP4Box](http://gpac.wp.mines-telecom.fr/mp4box/) tool from the [GPAC](http://gpac.wp.mines-telecom.fr) project. 
It can be used to:
- [get information about an MP4 file] (#getting-information), 
- [segment](#segmentation) an MP4 file for use with the [Media Source Extension API](https://dvcs.w3.org/hg/html-media/raw-file/tip/media-source/media-source.html),
- [extract](#extraction) samples from an MP4 to create TextTracks.
- more to come.

A demo is available [here](http://download.tsi.telecom-paristech.fr/gpac/mp4box.js/) and the QUnit tests are [here](http://download.tsi.telecom-paristech.fr/gpac/mp4box.js/qunit.html)

API
===

###Getting Information###
Similar to `MP4Box -info file.mp4`, MP4Box.js can provide general information about the file (duration, number and types of tracks ...). Create an MP4Box object, set the `onReady` callback and provide data in the form of ArrayBuffer objects. MP4Box.js supports progressive parsing. You can provide small buffers at a time, the callback will be called when the 'moov' box is parsed.

```javascript
var mp4box = new MP4Box();
mp4box.onError = function(e) {};
mp4box.onReady = function(info) {};
mp4box.appendBuffer(data);
mp4box.appendBuffer(data);
mp4box.appendBuffer(data);
...
mp4box.flush();
```

####onMoovStart()####
The `onMoovStart` callback is called when the 'moov' box is starting to be parsed, i.e. when the metadata about the file is parsed. Depending on the download speed, it may take a while to download the whole 'moov' box. The end of parsing is signaled by the `onReady` callback.

```javascript
mp4box.onMoovStart = function (info) {
	console.log("Starting to receive File Information");
}
```

####onReady(info)####
The `onReady` callback is called when the the 'moov' box has been parsed, i.e. when the metadata about the file is parsed. 

```javascript
mp4box.onReady = function (info) {
	console.log("Received File Information");
}
```

The `info` argument is an object with the following structure.
```json
{
  "duration":360002,
  "timescale":600,
  "isFragmented":false,
  "isProgressive":true,
  "hasIOD":true,
  "brands":["isom"],
  "created":"2014-04-15T18:24:40.000Z",
  "modified":"2014-04-15T18:24:40.000Z",
  "tracks":[
    {
	  "id":2,
	  "created":"2012-02-13T23:07:31.000Z",
	  "modified":"2014-04-16T12:22:56.000Z",
	  "movie_duration":360000,
	  "layer":0,
	  "alternate_group":0,
	  "volume":0,
	  "track_width":320,
	  "track_height":180,
	  "timescale":25000,
	  "duration":15000000,
	  "bitrate":120000,
	  "codec":"avc1.42c00d",
	  "video":{
	    "width":320,"height":180
	  },
	  "language":"und",
	  "nb_samples":15000
	},
	{
	  "id":3,
	  "created":"2012-09-12T11:14:57.000Z",
	  "modified":"2014-04-16T12:22:56.000Z",
	  "movie_duration":360002,
	  "layer":0,
	  "alternate_group":0,
	  "volume":1,
	  "track_width":0,
	  "track_height":0,
	  "timescale":44100,
	  "duration":26460160,
	  "bitrate":60000,
	  "codec":"mp4a.40.2",
	  "audio":{
	    "sample_rate":44100,
		"channel_count":1,
		"sample_size":16
	  },
	  "language":"und",
	  "nb_samples":25840
	}
  ]
}
```
- **brands**: Array of 4CC codes corresponding to the file brands,
- **created**: Date object, indicating the creation date of the file as given in the file header,
- **modified**: Date object, indicating the last modification date of the file as given in the file header,
- **timescale**: Number, corresponding to the timescale as given in the file header,
- **duration**: Number, providing the duration of the movie (unfragmented part) in timescale units,
- **isProgressive**: boolean, indicating if the file can be played progressively,
- **isFragmented**: boolean, indicating if the file is already fragmented,
- **fragment_duration**: Number, giving the duration of the fragmented part of the file, in timescale units,
- **hasIOD**: boolean, indicating if the the file contains an MPEG-4 Initial Object Descriptor
- **tracks**: Array of track information objects

Track information object:
- **id**: Number, giving track identifier,
- **created**: Date object, indicating the creation date of the file as given in the track header,
- **modified**: Date object, indicating the last modification date of the file as given in the track header,
- **alternate_group**: Number, identifier of the alternate group the track belongs to,
- **timescale**: Number, indicating the track timescale, as given in the track header,
- **duration**: Number, providing the duration of the (unfragmented part of) track, in timescale units,
- **bitrate**: Number, providing the bitrate of the track in bits per second,
- **nb_samples**: Number, giving the number of track samples (ie. frames),
- **codec**: String, giving the MIME codecs parameter for this track (e.g. "avc1.42c00d" or "mp4a.40.2"), to be used to create SourceBuffer objects with [Media Source Extensions](https://dvcs.w3.org/hg/html-media/raw-file/tip/media-source/media-source.html),
- **language**: String, giving the 3-letter language code,
- **track_width**: Number, width of the track as indicated in the track header,
- **track_height**: Number, height of the track as indicated in the track header,
- **layer**: Number, layer information as indicated in the track header,
- **video**: Object, information specific for video tracks
- **audio**: Object, information specific for audio tracks

Video-specific information object:
- **width**: Number, width of the video track as indicated in the media header,
- **height**: Number, height of the video track as indicated in the media header,

Audio-specific information object:
- **sample_rate**: Number, sample rate as indicated in the media header,
- **channel_count**: Number, number of channels as indicated in the media header,
- **sample_size**: Number, size in bits of an uncompressed audio sample as indicated in the media header,

####onError(e)####
Indicates that an error has occured during the processing. `e` is a String.
```javascript
mp4box.onError = function (e) {
	console.log("Received Error Message "+e);
}
```

####appendBuffer(data)####
Provides an ArrayBuffer to parse from. The ArrayBuffer must have a `fileStart` (Number) property indicating the 0-based position of first byte of the ArrayBuffer in the original file. Returns the offset (in the original file) that is expected to be the `fileStart` value of the next buffer. 
```javascript
var ab = getArrayBuffer();
ab.fileStart = 0;
mp4box.appendBuffer(ab);
```

####flush()####
Indicates that no more data will be received and that all remaining samples should be flushed in the segmentation or extraction process.

###Segmentation###

```javascript
var mp4box = new MP4Box();
mp4box.onReady = function(info) {
  ...
  mp4box.onSegment = function (id, user, buffer) {}
  mp4box.setSegmentOptions(info.tracks[0].id, sb, options);  
  var initSegs = mp4box.initializeSegmentation();  
  ...
};
```

####setSegmentOptions(track_id, user, options)####
Indicates that the track with the given `track_id` should be segmented, with the given options. When segments are ready, the callback [onSegment](#onsegmentid_user_buffer) is called with the `user` parameter. The `options` argument is an object with the following properties:
- **nbSamples**: Number, representing the number of frames per segment, i.e. the time between 2 callbacks to onSegment. If not enough data is received to form a segment, received samples are kept. If not provided, the default is 1000.
- **rapAlignement**: boolean, indicating if segments should start with a RAP. If not provided, the default is true.

```javascript
mp4box.setSegmentOptions(1, sb, { nbSamples: 1000 });
```
 
####unsetSegmentOptions(track_id)####
Indicates that the track with the given `track_id` should not be segmented.
```javascript
mp4box.unsetSegmentOptions(1);
```

####onSegment(id, user, buffer)####
Callback called when a segment is ready, according to the options passed in [setSegmentOptions](##setsegmentoptionstrack_id-user-options). `user` is the caller of the segmentation, for this track, and `buffer` is an ArrayBuffer containing the Movie Fragments for this segment.

```javascript
mp4box.onSegment = function (id, user, buffer) {
	console.log("Received segment on track "+id+" for object "+user+" with a length of "+buffer.byteLength);
}
```

####initializeSegmentation()####
Indicates that the application is ready to receive segments. Returns an array of objects containing the following properties:
- **id**: Number, the track id 
- **user**: Object, the caller of the segmentation for this track, as given in [setSegmentOptions](##setsegmentoptionstrack_id-user-options)
- **buffer**: ArrayBuffer, the initialization segment for this track.

```json
[
  {
	"id":2,
	"buffer":"[ArrayBuffer]",
	"user":"[SourceBuffer]"
  },
  {
	"id":3,
	"buffer":"[ArrayBuffer]",
	"user":"[SourceBuffer]"
  }
]
```

###Extraction###
It is possible to extract the samples of a track, in a similar manner to the segmentation process.
```javascript
var mp4box = new MP4Box();
mp4box.onReady = function(info) {
  ...
  /* create a texttrack */
  var texttrack = v.addTextTrack("metadata", "Text track for extraction of track "+info.tracks[0].id);
  mp4box.onSamples = function (id, user, samples) {}
  mp4box.setExtractionsOptions(info.tracks[0].id, texttrack, options);  
  ...
};
```

####setExtractionOptions(track_id, user, options)####
Indicates that the track with the given `track_id` for which samples should be extracted, with the given options. When samples are ready, the callback [onSamples](#onsamplesid-user-samples) is called with the `user` parameter. The `options` argument is an object with the following properties:
- **nbSamples**: Number, representing the number of samples per callback callt. If not enough data is received to extract the number of samples, the samples received so far are kept. If not provided, the default is 1000.
- **rapAlignement**: boolean, indicating if sample arrays should start with a RAP. If not provided, the default is true.

```javascript
mp4box.setExtractionOptions(1, texttrack, { nbSamples: 1000 });
```
 
####unsetExtractionOptions(track_id)####
Indicates that the samples for the track with the given `track_id` should not be extracted.
```javascript
mp4box.unsetExtractionOptions(1);
```

####onSamples(id, user, samples)####
Callback called when a set of samples is ready, according to the options passed in [setExtractionOptions](#setextractionoptionstrack_id-user-options). `user` is the caller of the segmentation, for this track, and `samples` is an Array of samples.

```javascript
mp4box.onSamples = function (id, user, samples) {
	console.log("Received "+samples.length+" samples on track "+id+" for object "+user);
}
```

Each sample has the following structure:
```json
{
	"track_id":4,
	"description": [Box],
	"is_rap":true,
	"timescale":1000,
	"dts":0,
	"cts":0,
	"duration":1000,
	"size":41,
	"data": [ArrayBuffer]
}
```

####seek(time, useRap)####
Indicates that the next samples to process (for extraction or segmentation) start at the given time (Number, in seconds) or at the time of the previous Random Access Point (if useRap is true, default is false). Returns the offset in the file of the next bytes to be provided via [appendBuffer](#appendbufferdata) .
```javascript
mp4box.seek(10, true);
```

Dependencies
=======
This code uses [DataStream.js](https://github.com/kig/DataStream.js), with some modifications for Uint24 and Uint64 types.

Browser Usage
=======

There is currently no build system. In order to use the `MP4Box.js` in a browser, you need to include all files as follows.

```html
<html>
<head>
  <meta charset="utf-8">
  <title>MP4Box.js in the browser</title>
  <script src="log.js"></script>
  <script src="DataStream.js"></script>
  <script src="descriptor.js"></script>
  <script src="box.js"></script>
  <script src="text-mp4.js"></script>
  <script src="isofile.js"></script>
  <script src="mp4box.js"></script>
</head>
<body>
...
</body>
</html>
```

