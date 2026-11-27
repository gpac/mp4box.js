---
'mp4box': patch
---

Write the object type indication of `mp4a` and `mp4v` codec strings in uppercase hexadecimal, as MP4Box does. MP3 in MP4 was reported as `mp4a.6b`, which Chromium's `canPlayType()` does not recognize; it is now `mp4a.6B`.
