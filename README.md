MP4Box.js
======

JavaScript library to process MP4 files in the browser, with support for progressive parsing. 
Inspired by the [MP4Box](http://gpac.wp.mines-telecom.fr/mp4box/) tool from the [GPAC](http://gpac.wp.mines-telecom.fr) project. 
It can be used to:
- get information about an MP4 file, 
- segment an MP4 file for use with the [Media Source Extension API](https://dvcs.w3.org/hg/html-media/raw-file/tip/media-source/media-source.html),
- more to come.

A demo is available [here](http://download.tsi.telecom-paristech.fr/gpac/mp4box.js/).

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
```

####onReady(info)####
The `onReady` callback is called when the the 'moov' box has been parsed, i.e. when the metadata about the file is parsed. The `info` argument is an object with the following structure
```json
{
  brands: list of 4CC codes corresponding to the file brands,
  created: Date object,
  modified: Date object,
  timescale: file timescale,
  duration: duration of the movie (unfragmented part) in timescale units,
  isProgressive: boolean indicating if the file can be played progressively,
  isFragmented: boolean indicating if the file is already fragmented,
  fragment_duration: duration of the fragmented part of the movie in timescale units,
  hasIOD: boolean indicating if the the file contains an MPEG-4 Initial Object Descriptor
  tracks: array of track information objects
}
```

Track information object:
```json
{
  id: track identifier,
  created: Date object,
  modified: Date object,
  alternate_group: identifier of the alternate group the track belongs to,
  timescale: track timescale,
  duration: duration of the track (unfragmented part) in timescale units,
  nb_samples: number of track samples (ie. frames),
  codec: MIME codecs parameter for this track,
  language: 3-letter language code,
  track_width: width information as indicated in the track header
  track_height: height information as indicated in the track header
  layer: layer information as indicated in the track header
  video: information object for video tracks
  audio: information object for audio tracks
}
```

```json
{
  width: width of the video track as indicated in the media header,
  height: height of the video track as indicated in the media header,
}
```

```json
{
  sample_rate: sample rate as indicated in the media header,
  channel_count: number of channels as indicated in the media header,
  sample_size: size an uncompressed audio sample as indicated in the media header,
}
```

####onError(e)####


###Segmentation###

```javascript
var mp4box = new MP4Box();
mp4box.onReady = function(info) {
...
mp4box.onSegment = function (user, buffer) {}
mp4box.setSegmentOptions(track_id, user, options);
mp4box.initializeSegmentation();
...
};
```

####setSegmentOptions(track_id, user, options)####
Indicates that the track with the given `track_id` should be segmented, with the given options. When segments are ready, according to the options, the callback [onSegment](#onSegment) is called with the `user` parameter. The `options` argument is an object with the following properties:
 
```json
{
  duration: duration, in track timescale, between 2 callbacks to onSegment. If not enough data is received to form a segment, received samples are kept (default is 100 ms).
  rapAlignement: boolean indicating if segments should start with a RAP (default: true)
}
```

####unsetSegmentOptions(track_id)####
Indicates that the track with the given `track_id` should not be segmented anymore.

####onSegment(user, buffer)####
Callback called when a segment is ready, according to the options passed in [setSegmentOptions](#setSegmentOptions). `user` is the caller of the segmentation, specific for this track, and `buffer` is an ArrayBuffer containing the Movie Fragments for this segment.

####initializeSegmentation()####
Indicates that the application is ready to receive segments. Returns an array of objects containing the track id and the initialization segment for this track.

Dependencies
=======
This code uses DataStream.js, with some modifications for Uint24 and Uint64 types.

Browser Usage
=======

There is currently no build system. In order to use the `MP4Box.js` in a browser, you need to include all files as follows.

```html
<html>
<head>
  <meta charset="utf-8">
  <title>MP4Box.js in the browser</title>
  <script src="DataStream.js"></script>
  <script src="descriptor.js"></script>
  <script src="box.js"></script>
  <script src="isofile.js"></script>
  <script src="mp4box.js"></script>
</head>
<body>
...
</body>
</html>
```

