---
'mp4box': patch
---

Fix `seek` on fragmented files: samples from `moof` boxes now start with `alreadyRead` set to 0, so the seek offset is no longer `NaN`
