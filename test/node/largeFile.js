const fs = require('fs');
const MP4Box = require('../../dist/mp4box.all.js');

if (process.argv.length <=2 ) {
	console.log("usage: node largeFile.js <file> y");
	process.exit(0);
}
// node test/node/largeFile.js "C:\\gopro\\20200802\\GH010367.MP4" y
// node test/node/largeFile.js "c:\\workspace\\gpmf-extract\\samples\\karma.mp4" y
if (4 <= process.argv.length) {
  MP4Box.Log.setLogLevel(MP4Box.Log[process.argv[3]]);
}
const mp4boxFile = MP4Box.createFile();
mp4boxFile.onReady =  (videoData) => {
  console.log("onReady");
  for (let i = 0; i < videoData.tracks.length; i++) {
    const track = videoData.tracks[i];
    const codec = track.codec;
    const trackId = track.id;
    const nb_samples = track.nb_samples;
    mp4boxFile.setExtractionOptions(trackId, null, { nbSamples: nb_samples});
    console.log("i:" + i + ",trackId:" + trackId + ",codec:" + codec + ",nb_samples:" + nb_samples);
  }

  mp4boxFile.start();
};
mp4boxFile.onSamples = (id, user, samples) => {
  console.log("onSamples:", id,user, samples.length);
}
mp4boxFile.onError = (e) => {
  console.log("onError",e);
}
mp4boxFile.onSegment = (e) => {
  console.log("onSegment");
}

const path = process.argv[2];

const chunkSize = 1024 * ((5 <= process.argv.length) ? parseInt(process.argv[4]): 10); 
console.log(`chunk-size: ${chunkSize}`);
const stream = fs.createReadStream(path, {'highWaterMark': chunkSize});
let bytesRead = 0;
stream.on('end', function (){
  console.log("end");
	mp4boxFile.flush();
});
stream.on('data', function (chunk) {
	const arrayBuffer = new Uint8Array(chunk).buffer;
	arrayBuffer.fileStart = bytesRead;
  mp4boxFile.appendBuffer(arrayBuffer);
  bytesRead += chunk.length;
});
stream.resume();


