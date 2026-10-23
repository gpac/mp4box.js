---
'mp4box': minor
---

Box types are no longer reported as invalid in QuickTime files, where any 32-bit value is allowed. The new `allowInvalidBoxTypes` option of `createFile` and `ISOFile` logs a warning for an invalid box type and continues parsing, instead of aborting
