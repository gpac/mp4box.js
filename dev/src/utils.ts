import { Log } from 'mp4box';

export function computeWaitingTimeFromBuffer(v: {
  ms: unknown;
  currentTime: number;
  playbackRate: number;
}) {
  var ms = v.ms;
  var sb;
  var startRange, endRange;
  var currentTime = v.currentTime;
  var playbackRate = v.playbackRate;
  var maxStartRange = 0;
  var minEndRange = Infinity;
  var ratio;
  var wait;
  var duration;
  /* computing the intersection of the buffered values of all active sourcebuffers around the current time, 
	   may already be done by the browser when calling video.buffered (to be checked: TODO) */
  for (var i = 0; i < ms.activeSourceBuffers.length; i++) {
    sb = ms.activeSourceBuffers[i];
    for (var j = 0; j < sb.buffered.length; j++) {
      startRange = sb.buffered.start(j);
      endRange = sb.buffered.end(j);
      if (currentTime >= startRange && currentTime <= endRange) {
        if (startRange >= maxStartRange) maxStartRange = startRange;
        if (endRange <= minEndRange) minEndRange = endRange;
        break;
      }
    }
  }
  if (minEndRange === Infinity) {
    minEndRange = 0;
  }
  duration = minEndRange - maxStartRange;
  ratio = (currentTime - maxStartRange) / duration;
  Log.info(
    'Demo',
    'Playback position (' +
      Log.getDurationString(currentTime) +
      ') in current buffer [' +
      Log.getDurationString(maxStartRange) +
      ',' +
      Log.getDurationString(minEndRange) +
      ']: ' +
      Math.floor(ratio * 100) +
      '%',
  );
  if (ratio >= 3 / (playbackRate + 3)) {
    Log.info('Demo', 'Downloading immediately new data!');
    /* when the currentTime of the video is at more than 3/4 of the buffered range (for a playback rate of 1), 
		   immediately fetch a new buffer */
    return 1; /* return 1 ms (instead of 0) to be able to compute a non-infinite bitrate value */
  } else {
    /* if not, wait for half (at playback rate of 1) of the remaining time in the buffer */
    wait = (1000 * (minEndRange - currentTime)) / (2 * playbackRate);
    Log.info(
      'Demo',
      'Waiting for ' + Log.getDurationString(wait, 1000) + ' s for the next download',
    );
    return wait;
  }
}
