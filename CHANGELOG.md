# mp4box

## 2.4.0

### Minor Changes

- [#514](https://github.com/gpac/mp4box.js/pull/514) [`139d653`](https://github.com/gpac/mp4box.js/commit/139d65350f9ed92b543c031794959f5448cb66bd) Thanks [@y-guyon](https://github.com/y-guyon)! - feat: display `ftyp` minor_version as number or fourcc

- [#533](https://github.com/gpac/mp4box.js/pull/533) [`42064fd`](https://github.com/gpac/mp4box.js/commit/42064fd33e61c037bc799c8b8b8aa8932c3d2168) Thanks [@dukesook](https://github.com/dukesook)! - add `ItemComponentContentIDProperty` from GIMI

- [#549](https://github.com/gpac/mp4box.js/pull/549) [`4199d94`](https://github.com/gpac/mp4box.js/commit/4199d9411b1a027d11780954c9a5b9a95148e3bc) Thanks [@lideen](https://github.com/lideen)! - feat: add per-track initialization segments for segmentation

- [#540](https://github.com/gpac/mp4box.js/pull/540) [`865838e`](https://github.com/gpac/mp4box.js/commit/865838ea2a5850dfae9d99fd702e42f864942208) Thanks [@dukesook](https://github.com/dukesook)! - feat: add `cmpC` box from ISO/IEC 23001-17 FDAM2

### Patch Changes

- [#550](https://github.com/gpac/mp4box.js/pull/550) [`fdbdf11`](https://github.com/gpac/mp4box.js/commit/fdbdf115c688b3558a9a0309f411e5d3ab05e42f) Thanks [@lideen](https://github.com/lideen)! - fix: include nested QuickTime wave esds when deriving mp4a codec strings

- [#543](https://github.com/gpac/mp4box.js/pull/543) [`a08dba1`](https://github.com/gpac/mp4box.js/commit/a08dba1a103fa99b3d7c70847bafbaa5932347bb) Thanks [@rbouqueau](https://github.com/rbouqueau)! - fix: tfra box parsing didn't allow to display all information

- [#535](https://github.com/gpac/mp4box.js/pull/535) [`5b72b08`](https://github.com/gpac/mp4box.js/commit/5b72b087ada60d118a9057af17b13e9713ded576) Thanks [@dukesook](https://github.com/dukesook)! - add `entry_count` to `saio` box

- [`c6227fd`](https://github.com/gpac/mp4box.js/commit/c6227fd0c29ce4c26ac3a549fdf42313a4b1bc68) Thanks [@plantysnake](https://github.com/plantysnake)! - fixes to pass 7 ignored test files from File Format Conformance

- [#548](https://github.com/gpac/mp4box.js/pull/548) [`fe69a56`](https://github.com/gpac/mp4box.js/commit/fe69a56cfe2ba6eecdd112bae1b89e17b9b4db64) Thanks [@lideen](https://github.com/lideen)! - fix: reset fragmentation state on seek to prevent invalid fragment ranges

- [#539](https://github.com/gpac/mp4box.js/pull/539) [`871def4`](https://github.com/gpac/mp4box.js/commit/871def44b37803a67c0ece45020bca0434397476) Thanks [@dukesook](https://github.com/dukesook)! - warn if primary item id is invalid

- [#550](https://github.com/gpac/mp4box.js/pull/550) [`fdbdf11`](https://github.com/gpac/mp4box.js/commit/fdbdf115c688b3558a9a0309f411e5d3ab05e42f) Thanks [@lideen](https://github.com/lideen)! - fix: normalize QuickTime wave esds in fragmented init segments for MSE compatibility

  By default, segmentation writes MSE-compatible `mp4a.esds` sample entries when source
  QuickTime files store AAC decoder config under `mp4a.wave.esds`. This behavior can be
  disabled with `setSegmentOptions(..., { normalizeAudioSampleEntriesForMSE: false })`
  to preserve nested QuickTime `wave.esds` sample entries in initialization segments.
