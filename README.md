<div align="center">

# MP4Box.js

### A Powerful JavaScript Library for MP4 File Processing

MP4Box.js enables advanced MP4 parsing, segmentation, and sample extraction directly in the browser or in Node.js environments. Built for performance and flexibility, it's inspired by the [MP4Box](https://wiki.gpac.io/MP4Box/MP4Box) tool from the [GPAC Project](http://gpac.io).

[![Build & Test](https://github.com/gpac/mp4box.js/actions/workflows/test.yml/badge.svg)](https://github.com/gpac/mp4box.js/actions/workflows/test.yml)
[![NPM Downloads](https://img.shields.io/npm/dm/mp4box)](https://www.npmjs.com/package/mp4box)
[![Latest Version](https://img.shields.io/npm/v/mp4box/latest.svg?color=blue)](https://www.npmjs.com/package/mp4box/v/latest)
[![Next Version](https://img.shields.io/npm/v/mp4box/next.svg?color=red)](https://www.npmjs.com/package/mp4box/v/next)

</div>

---

## Key Features

MP4Box.js makes it easy to work with MP4 files using JavaScript, offering:

- **Progressive Parsing**: Analyze MP4 content as it's being loaded.
- **Segmentation**: Split MP4 files for use with the [Media Source Extensions (MSE)](https://www.w3.org/TR/media-source/) API.
- **Sample Extraction**: Extract media samples for custom processing, such as generating subtitles or audio analysis.
- **Cross-Platform Support**: Works seamlessly in both browser and Node.js environments.

## Use Cases

You can use MP4Box.js to:

- 🔍 [Inspect MP4 metadata](#getting-information) in real-time
- ✂️ [Segment MP4 files](#segmentation) for adaptive streaming or MSE playback
- 🎯 [Extract specific samples](#extraction) to build features like TextTracks or timeline previews

On this page, you'll find documentation on how to [build MP4box.js](#build), [install](#installation), [use it in a browser](#browser-usage), or [contribute](./CONTRIBUTING.md).

## Installation

You can install MP4Box.js via npm:

```bash
npm install mp4box@latest
```

## Demos

- [A player that performs on-the-fly fragmentation](./test/index.html)
- [A file inspection tool](./test/filereader.html)
- [A basic file segmenter](./test/file-segmenter.html)
- [A file diff tool](./test/filediff.html)
- [An MSE-based AVIF viewing tool](./test/mse-avif-viewer.html)
- [QUnit tests](./test/qunit.html)

## API

### Getting Information

Similar to `MP4Box -info file.mp4`, MP4Box.js can provide general information about the file (duration, number and types of tracks ...). For that, create an MP4Box ISOFile object, set the `onReady` callback and provide data in the form of ArrayBuffer objects. MP4Box.js supports progressive parsing. You can provide small buffers at a time, the callback will be called when the 'moov' box is parsed.

```javascript
var MP4Box = require('mp4box'); // Or whatever import method you prefer.
var mp4boxfile = MP4Box.createFile();
mp4boxfile.onError = function(e) {};
mp4boxfile.onReady = function(info) {};
mp4boxfile.appendBuffer(data);
mp4boxfile.appendBuffer(data);
mp4boxfile.appendBuffer(data);
...
mp4boxfile.flush();
```

#### onMoovStart()

The `onMoovStart` callback is called when the 'moov' box is starting to be parsed. Depending on the download speed, it may take a while to download the whole 'moov' box. The end of parsing is signaled by the `onReady` callback.

```javascript
mp4boxfile.onMoovStart = function () {
  console.log('Starting to receive File Information');
};
```

#### onReady(info)

The `onReady` callback is called when the the 'moov' box has been parsed, i.e. when the metadata about the file is parsed.

```javascript
mp4boxfile.onReady = function (info) {
  console.log('Received File Information');
};
```

The `info` argument is an object with the following structure.

```json
{
  "duration": 360002,
  "timescale": 600,
  "isFragmented": false,
  "isProgressive": true,
  "hasIOD": true,
  "brands": ["isom"],
  "created": "2014-04-15T18:24:40.000Z",
  "modified": "2014-04-15T18:24:40.000Z",
  "tracks": [
    {
      "id": 2,
      "created": "2012-02-13T23:07:31.000Z",
      "modified": "2014-04-16T12:22:56.000Z",
      "movie_duration": 360000,
      "layer": 0,
      "alternate_group": 0,
      "volume": 0,
      "track_width": 320,
      "track_height": 180,
      "timescale": 25000,
      "duration": 15000000,
      "bitrate": 120000,
      "codec": "avc1.42c00d",
      "video": {
        "width": 320,
        "height": 180
      },
      "language": "und",
      "nb_samples": 15000
    },
    {
      "id": 3,
      "created": "2012-09-12T11:14:57.000Z",
      "modified": "2014-04-16T12:22:56.000Z",
      "movie_duration": 360002,
      "layer": 0,
      "alternate_group": 0,
      "volume": 1,
      "track_width": 0,
      "track_height": 0,
      "timescale": 44100,
      "duration": 26460160,
      "bitrate": 60000,
      "codec": "mp4a.40.2",
      "audio": {
        "sample_rate": 44100,
        "channel_count": 1,
        "sample_size": 16
      },
      "language": "und",
      "nb_samples": 25840
    }
  ]
}
```

- **brands**: Array of 4CC codes corresponding to the file brands as given in the ftyp box,
- **created**: Date object, indicating the creation date of the file as given in the movie header,
- **modified**: Date object, indicating the last modification date of the file as given in the movie header,
- **timescale**: Number, corresponding to the timescale as given in the movie header,
- **duration**: Number, providing the duration of the movie (unfragmented part) in timescale units,
- **isProgressive**: boolean, indicating if the file can be played progressively,
- **isFragmented**: boolean, indicating if the file is already fragmented,
- **fragment_duration**: Number, giving the duration of the fragmented part of the file, in timescale units,
- **hasIOD**: boolean, indicating if the file contains an MPEG-4 Initial Object Descriptor
- **tracks**: Array of track information objects

Track information object:

- **id**: Number, giving track identifier,
- **created**: Date object, indicating the creation date of the file as given in the track header,
- **modified**: Date object, indicating the last modification date of the file as given in the track header,
- **alternate_group**: Number, identifier of the alternate group the track belongs to,
- **timescale**: Number, indicating the track timescale, as given in the track header,
- **duration**: Number, providing the duration of the (unfragmented part of) track, in timescale units,
- **bitrate**: Number, providing the bitrate of the track in bits per second,
- **nb_samples**: Number, giving the number of track samples (i.e. frames),
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

#### onError(e)

Indicates that an error has occurred during the processing. `e` is a String.

```javascript
mp4boxfile.onError = function (e) {
  console.log('Received Error Message ' + e);
};
```

#### appendBuffer(data)

Provides an ArrayBuffer to parse from. The ArrayBuffer must have a `fileStart` (Number) property indicating the 0-based position of first byte of the ArrayBuffer in the original file. Returns the offset (in the original file) that is expected to be the `fileStart` value of the next buffer. This is particularly useful when the moov box is not at the beginning of the file.

```javascript
var ab = getArrayBuffer(); // any of your own method that returns an ArrayBuffer
ab.fileStart = 0;
var nextBufferStart = mp4boxfile.appendBuffer(ab);
```

#### start()

Indicates that sample processing can start (segmentation or extraction). Sample data already received will be processed and new buffer append operation will trigger sample processing as well.

#### stop()

Indicates that sample processing is stopped. Buffer append operations will not trigger calls to onSamples or onSegment.

#### flush()

Indicates that no more data will be received and that all remaining samples should be flushed in the segmentation or extraction process.

### Segmentation

```javascript
var mp4boxfile = MP4Box.createFile();
mp4boxfile.onReady = function(info) {
  ...
  mp4boxfile.onSegment = function (id, user, buffer, sampleNumber, last) {}
  mp4boxfile.setSegmentOptions(info.tracks[0].id, sb, options);
  var initSegs = mp4boxfile.initializeSegmentation();
  mp4boxfile.start();
  ...
};
```

#### setSegmentOptions(track_id, user, options)

Indicates that the track with the given `track_id` should be segmented, with the given options. When segments are ready, the callback [onSegment](#onsegmentid_user_buffer) is called with the `user` parameter. The `options` argument is an object with the following properties:

- **nbSamples**: Number, representing the number of frames per segment, i.e. the time between 2 callbacks to onSegment. If not enough data is received to form a segment, received samples are kept. If not provided, the default is 1000.
- **rapAlignement**: boolean, indicating if segments should start with a RAP. If not provided, the default is true.

```javascript
mp4boxfile.setSegmentOptions(1, sb, { nbSamples: 1000 });
```

#### unsetSegmentOptions(track_id)

Indicates that the track with the given `track_id` should not be segmented.

```javascript
mp4boxfile.unsetSegmentOptions(1);
```

#### onSegment(id, user, buffer, sampleNumber, last)

Callback called when a segment is ready, according to the options passed in [setSegmentOptions](##setsegmentoptionstrack_id-user-options). `user` is the caller of the segmentation, for this track, and `buffer` is an ArrayBuffer containing the Movie Fragments for this segment.

```javascript
mp4boxfile.onSegment = function (id, user, buffer, sampleNumber, last) {
  console.log(
    'Received segment on track ' +
      id +
      ' for object ' +
      user +
      ' with a length of ' +
      buffer.byteLength,
  );
};
```

#### initializeSegmentation()

Indicates that the application is ready to receive segments. Returns an array of objects containing the following properties:

- **id**: Number, the track id
- **user**: Object, the caller of the segmentation for this track, as given in [setSegmentOptions](##setsegmentoptionstrack_id-user-options)
- **buffer**: ArrayBuffer, the initialization segment for this track.
- **sampleNumber**: Number, sample number of the last sample in the segment, plus 1.
- **last**: Boolean, indication if this is the last segment to be received.

```json
[
  {
    "id": 2,
    "buffer": "[ArrayBuffer]",
    "user": "[SourceBuffer]"
  },
  {
    "id": 3,
    "buffer": "[ArrayBuffer]",
    "user": "[SourceBuffer]"
  }
]
```

### Extraction

It is possible to extract the samples of a track, in a similar manner to the segmentation process.

```javascript
var mp4boxfile = MP4Box.createFile();
mp4boxfile.onReady = function(info) {
  ...
  /* create a texttrack */
  var texttrack = v.addTextTrack("metadata", "Text track for extraction of track "+info.tracks[0].id);
  mp4boxfile.onSamples = function (id, user, samples) {}
  mp4boxfile.setExtractionOptions(info.tracks[0].id, texttrack, options);
  mp4boxfile.start();
  ...
};
```

#### setExtractionOptions(track_id, user, options)

Indicates that the track with the given `track_id` for which samples should be extracted, with the given options. When samples are ready, the callback [onSamples](#onsamplesid-user-samples) is called with the `user` parameter. The `options` argument is an object with the following properties:

- **nbSamples**: Number, representing the number of samples per callback call. If not enough data is received to extract the number of samples, the samples received so far are kept. If not provided, the default is 1000.
- **rapAlignement**: boolean, indicating if sample arrays should start with a RAP. If not provided, the default is true.

```javascript
mp4boxfile.setExtractionOptions(1, texttrack, { nbSamples: 1000 });
```

#### unsetExtractionOptions(track_id)

Indicates that the samples for the track with the given `track_id` should not be extracted.

```javascript
mp4boxfile.unsetExtractionOptions(1);
```

#### onSamples(id, user, samples)

Callback called when a set of samples is ready, according to the options passed in [setExtractionOptions](#setextractionoptionstrack_id-user-options). `user` is the caller of the segmentation, for this track, and `samples` is an Array of samples.

```javascript
mp4boxfile.onSamples = function (id, user, samples) {
  console.log('Received ' + samples.length + ' samples on track ' + id + ' for object ' + user);
};
```

Each sample has the following structure:

```json
{
  "track_id": 4,
  "description": "[Box]",
  "is_rap": true,
  "timescale": 1000,
  "dts": 0,
  "cts": 0,
  "duration": 1000,
  "size": 41,
  "data": "[ArrayBuffer]"
}
```

#### seek(time, useRap)

Indicates that the next samples to process (for extraction or segmentation) start at the given time (Number, in seconds) or at the time of the previous Random Access Point (if useRap is true, default is false). Returns the offset in the file of the next bytes to be provided via [appendBuffer](#appendbufferdata) .

```javascript
mp4boxfile.seek(10, true);
```

#### releaseUsedSamples(id, sampleNumber)

Releases the memory allocated for sample data for the given track id, up to (but excluding) the given sample number.

```
mp4boxfile.releaseUsedSamples(1, 250);
```

## Build

`MP4Box.js` implements many features (parsing of many types of boxes, writing of boxes, sample processing, on-the-fly fragmentation ...). All these features may not be needed in all applications. In order to allow for a flexible configuration of the features, and to reduce the size of the final library, `MP4Box.js` is split in many files and uses the [tsup](https://tsup.egoist.dev/) to compile a set of selected features into a single file. Currently, `MP4Box.js` comes in two flavors:

- **all**: includes all the features
- **simple**: allows for parsing of boxes only (no writing, no sample processing) and only of some boxes (not all).

For every flavor, tsup builds ESM, CJS, and IIFE versions of the library, which can be used in different environments (browser, Node.js, etc.). The IIFE version is not distributed to npm, but utilized in the demos.

Run the following command to build the library:

```bash
npm run build
```

## Browser Usage

Nowadays, most projects use bundlers like Webpack, Rollup, or Vite to manage dependencies and build their applications. If you are using one of these tools, you can simply import `MP4Box.js` in your JavaScript files:

```ts
import * as MP4Box from 'mp4box';
```

If you are not using a bundler, you can still use `MP4Box.js` in the browser. The library is written in ES6 modules, so you can import it directly in your HTML file. However, you will need to build it first or use a pre-built version. Check the [Build](#build) section above for instructions on how to build the library.

Example of a simple HTML file that uses `MP4Box.js`:

```html
<html>
  <head>
    <meta charset="utf-8" />
    <title>MP4Box.js in the browser</title>
    <script src="https://cdn.jsdelivr.net/npm/mp4box/dist/mp4box.all.js"></script>
    <!-- Alternatively, you can use a local build -->
    <!-- <script type="module" src="mp4box.all.js"></script> -->
  </head>
  <body>
    <script type="module">
      import * as MP4Box from './mp4box.all.js';

      // Create a new MP4Box instance
      const mp4box = MP4Box.createFile();

      // Example usage: Add a file to the MP4Box instance
      // Note: You would typically fetch or read a file here
      // For demonstration, we will just log the instance
      console.log(mp4box);
    </script>
  </body>
</html>
```

# Contribute

If your favorite box is not parsed by MP4Box, you can easily contribute. Check out the [CONTRIBUTING.md](./CONTRIBUTING.md) file for more information on how to add support for new boxes or features.

To contribute to MP4Box.js, simply clone the repository, run `npm install` and `npm test`.
