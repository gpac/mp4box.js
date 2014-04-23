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
The `onReady` callback is called when the the 'moov' box has been parsed, i.e. when the metadata about the file is parsed. The `info` argument is an object with the following structure.

```json
{"duration":360002,"timescale":600,"isFragmented":false,"isProgressive":true,"hasIOD":true,"brands":["isom"],"created":"2014-04-15T18:24:40.000Z","modified":"2014-04-15T18:24:40.000Z","tracks":[{"id":2,"created":"2012-02-13T23:07:31.000Z","modified":"2014-04-16T12:22:56.000Z","movie_duration":360000,"layer":0,"alternate_group":0,"volume":0,"matrix":{"0":65536,"1":0,"2":0,"3":0,"4":65536,"5":0,"6":0,"7":0,"8":1073741824},"track_width":320,"track_height":180,"timescale":25000,"duration":15000000,"codec":"avc1.42c00d","video_width":320,"video_height":180,"audio_sample_rate":"","audio_channel_count":"","language":"und","nb_samples":15000},{"id":3,"created":"2012-09-12T11:14:57.000Z","modified":"2014-04-16T12:22:56.000Z","movie_duration":360002,"layer":0,"alternate_group":0,"volume":256,"matrix":{"0":65536,"1":0,"2":0,"3":0,"4":65536,"5":0,"6":0,"7":0,"8":1073741824},"track_width":0,"track_height":0,"timescale":44100,"duration":26460160,"codec":"mp4a.40.2","video_width":"","video_height":"","audio_sample_rate":44100,"audio_channel_count":1,"language":"und","nb_samples":25840}]}
```
- brands: Array of 4CC codes corresponding to the file brands,
- created: Date object, indicating the creation date of the file as given in the file header,
- created: Date object, indicating the last modification date of the file as given in the file header,
- timescale: Number, corresponding to the timescale as given in the file header,
- duration: Number, providing the duration of the movie (unfragmented part) in timescale units,
- isProgressive: boolean, indicating if the file can be played progressively,
- isFragmented: boolean, indicating if the file is already fragmented,
- fragment_duration: Number, giving the duration of the fragmented part of the file, in timescale units,
- hasIOD: boolean, indicating if the the file contains an MPEG-4 Initial Object Descriptor
- tracks: Array of track information objects

Track information object:
- id: Number, giving track identifier,
- created: Date object, indicating the creation date of the file as given in the track header,
- modified: Date object, indicating the last modification date of the file as given in the track header,
- alternate_group: Number, identifier of the alternate group the track belongs to,
- timescale: Number, indicating the track timescale, as given in the track header,
- duration: Number, providing the duration of the (unfragmented part of) track, in timescale units,
- nb_samples: Number, giving the number of track samples (ie. frames),
- codec: String, giving the MIME codecs parameter for this track,
- language: String, giving the 3-letter language code,
- track_width: Number, width of the track as indicated in the track header,
- track_height: Number, height of the track as indicated in the track header,
- layer: Number, layer information as indicated in the track header,
- video: Object, information specific for video tracks
- audio: Object, information specific for audio tracks

Video-specific information object:
- width: Number, width of the video track as indicated in the media header,
- height: Number, height of the video track as indicated in the media header,

Audio-specific information object:
- sample_rate: Number, sample rate as indicated in the media header,
- channel_count: Number, number of channels as indicated in the media header,
- sample_size: Number, size an uncompressed audio sample as indicated in the media header,

####onError(e)####


###Segmentation###

```javascript
var mp4box = new MP4Box();
mp4box.onReady = function(info) {
...
mp4box.onSegment = function (user, buffer) {}
mp4box.setSegmentOptions(track_id, user, options);
var initSegs = mp4box.initializeSegmentation();
...
};
```

####setSegmentOptions(track_id, user, options)####
Indicates that the track with the given `track_id` should be segmented, with the given options. When segments are ready, the callback [onSegment](#onSegment) is called with the `user` parameter. The `options` argument is an object with the following properties:

- duration: Number, representing the duration, in track timescale, between 2 callbacks to onSegment. If not enough data is received to form a segment, received samples are kept. If not provided, the default is 100 ms.
- rapAlignement: boolean, indicating if segments should start with a RAP. If not provided, the default is true.
 
####unsetSegmentOptions(track_id)####
Indicates that the track with the given `track_id` should not be segmented anymore.

####onSegment(user, buffer)####
Callback called when a segment is ready, according to the options passed in [setSegmentOptions](#setSegmentOptions). `user` is the caller of the segmentation, for this track, and `buffer` is an ArrayBuffer containing the Movie Fragments for this segment.

####initializeSegmentation()####
Indicates that the application is ready to receive segments. Returns an array of objects containing the following properties:
- id: Number, the track id 
- user: Object, the caller of the segmentation for this track, as given in [setSegmentOptions](#setSegmentOptions)
- buffer: ArrayBuffer, the initialization segment for this track.

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

