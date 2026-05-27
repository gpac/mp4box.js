---
"mp4box": patch
---

fix: normalize QuickTime wave esds in fragmented init segments for MSE compatibility

By default, segmentation writes MSE-compatible `mp4a.esds` sample entries when source
QuickTime files store AAC decoder config under `mp4a.wave.esds`. This behavior can be
disabled with `setSegmentOptions(..., { normalizeAudioSampleEntriesForMSE: false })`
to preserve nested QuickTime `wave.esds` sample entries in initialization segments.
