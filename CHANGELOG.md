# mp4box

## 2.4.0

### Minor Changes

- [#549](https://github.com/gpac/mp4box.js/pull/549) [`4199d94`](https://github.com/gpac/mp4box.js/commit/4199d9411b1a027d11780954c9a5b9a95148e3bc) Thanks [@lideen](https://github.com/lideen)! - feat: add per-track initialization segments for segmentation

### Patch Changes

- [#550](https://github.com/gpac/mp4box.js/pull/550) [`fdbdf11`](https://github.com/gpac/mp4box.js/commit/fdbdf115c688b3558a9a0309f411e5d3ab05e42f) Thanks [@lideen](https://github.com/lideen)! - fix: include nested QuickTime wave esds when deriving mp4a codec strings

- [#548](https://github.com/gpac/mp4box.js/pull/548) [`fe69a56`](https://github.com/gpac/mp4box.js/commit/fe69a56cfe2ba6eecdd112bae1b89e17b9b4db64) Thanks [@lideen](https://github.com/lideen)! - fix: reset fragmentation state on seek to prevent invalid fragment ranges

- [#550](https://github.com/gpac/mp4box.js/pull/550) [`fdbdf11`](https://github.com/gpac/mp4box.js/commit/fdbdf115c688b3558a9a0309f411e5d3ab05e42f) Thanks [@lideen](https://github.com/lideen)! - fix: normalize QuickTime wave esds in fragmented init segments for MSE compatibility

  By default, segmentation writes MSE-compatible `mp4a.esds` sample entries when source
  QuickTime files store AAC decoder config under `mp4a.wave.esds`. This behavior can be
  disabled with `setSegmentOptions(..., { normalizeAudioSampleEntriesForMSE: false })`
  to preserve nested QuickTime `wave.esds` sample entries in initialization segments.
