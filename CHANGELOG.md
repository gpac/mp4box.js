# mp4box

## 2.5.0

### Minor Changes

- [#474](https://github.com/gpac/mp4box.js/pull/474) [`38ef7ec`](https://github.com/gpac/mp4box.js/commit/38ef7ecf65e09cbcd0265f70d044317e14603963) Thanks [@paulhiggs](https://github.com/paulhiggs)! - Add AVS3 video and audio support: `av3c` and `dca3` configuration box parsing, `avs3`, `av3a` and `a3as` sample entries with codec string derivation, and `isByteAligned()`, `skipBits()` and `readUE()` bit-level reading to `DataStream`

- [#568](https://github.com/gpac/mp4box.js/pull/568) [`d570daa`](https://github.com/gpac/mp4box.js/commit/d570daa2d209fe457dec0f38fe6f35abf036e955) Thanks [@jamrial](https://github.com/jamrial)! - Add Dolby TrueHD `mlpa` sample entry and `dmlp` configuration box

- [#513](https://github.com/gpac/mp4box.js/pull/513) [`fcbe405`](https://github.com/gpac/mp4box.js/commit/fcbe405dfb5b67e087c203f007c4e46d934588a0) Thanks [@y-guyon](https://github.com/y-guyon)! - Support ISO/IEC 23008-12 AMD2 (low-overhead image file format) boxes: add `mini`, `cclv`, `amve`, `ndwt` and `reve` box parsing, support the `pixi` syntax for `flags` = 1, and add bit-level reading to `DataStream`

- [#573](https://github.com/gpac/mp4box.js/pull/573) [`7e254e3`](https://github.com/gpac/mp4box.js/commit/7e254e304953f4d1f93f4f6cb4c58b239d490f6a) Thanks [@musatoktas](https://github.com/musatoktas)! - Box types are no longer reported as invalid in QuickTime files, where any 32-bit value is allowed. The new `allowInvalidBoxTypes` option of `createFile` and `ISOFile` logs a warning for an invalid box type and continues parsing, instead of aborting

- [#567](https://github.com/gpac/mp4box.js/pull/567) [`38c2ac5`](https://github.com/gpac/mp4box.js/commit/38c2ac5d36d444f5eb2f5a7f0305fca7327b77e8) Thanks [@dukesook](https://github.com/dukesook)! - The uuid boxes now display the extended_type, even if the box is already registered

- [#565](https://github.com/gpac/mp4box.js/pull/565) [`9925057`](https://github.com/gpac/mp4box.js/commit/992505793e5a4aa5d513ec85e0cd7939535674a7) Thanks [@dukesook](https://github.com/dukesook)! - Read altt item property

### Patch Changes

- [`9b5bb9d`](https://github.com/gpac/mp4box.js/commit/9b5bb9dedc235c12066cfb8ac8ce22374285b6d3) Thanks [@DenizUgur](https://github.com/DenizUgur)! - Clarify the `discardMdatData` warnings emitted by `setSegmentOptions` and `setExtractionOptions`: samples are still segmented/extracted when their data is appended after `start()`

- [#572](https://github.com/gpac/mp4box.js/pull/572) [`213ac8d`](https://github.com/gpac/mp4box.js/commit/213ac8d951020c7d5324cb56981456b0ad4037f7) Thanks [@zzoraemon043](https://github.com/zzoraemon043)! - Fix `seek()` throwing when the movie contains a track without samples

- [#571](https://github.com/gpac/mp4box.js/pull/571) [`55e5bce`](https://github.com/gpac/mp4box.js/commit/55e5bce07978e74b828e744eb3683be74b72d985) Thanks [@rbouqueau](https://github.com/rbouqueau)! - fix short tkhd atom range error

- [#570](https://github.com/gpac/mp4box.js/pull/570) [`a9302b2`](https://github.com/gpac/mp4box.js/commit/a9302b278d439fdd6a102da6d5d20ad140ce4766) Thanks [@danilobassi8](https://github.com/danilobassi8)! - Honour the data_offset of every trun in a track fragment, and resolve the base data offset of non-first trafs per ISO/IEC 14496-12 when no base is declared

## 2.4.1

### Patch Changes

- [`bbf55fe`](https://github.com/gpac/mp4box.js/commit/bbf55fe2958bba4f118eb5f45b064a9ca38453df) Thanks [@DenizUgur](https://github.com/DenizUgur)! - Fix import paths and add a test to verify the tarball is installable.

  Release [v2.4.0](https://github.com/gpac/mp4box.js/releases/tag/v2.4.0) upgraded `tsdown`, which apparently changed the output extensions from `.js` to `.mjs` and from `.d.ts` to `.d.mts`. This made the package uninstallable because the import paths were not updated. This patch fixes those import paths and adds a test to verify that the tarball installs correctly.

  fixes [#561](https://github.com/gpac/mp4box.js/issues/561)

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
