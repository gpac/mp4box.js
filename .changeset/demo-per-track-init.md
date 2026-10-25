---
'mp4box': patch
---

Clarify the `discardMdatData` warnings emitted by `setSegmentOptions` and `setExtractionOptions`: samples are still segmented/extracted when their data is appended after `start()`
