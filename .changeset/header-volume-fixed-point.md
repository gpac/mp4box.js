---
'mp4box': patch
---

Read and write the `mvhd` and `tkhd` volume as 8.8 fixed point. Fractional volumes were truncated (0.5 became 0), `print()` shifted the value a second time so full volume showed as 0, and `init()` set `mvhd.volume` to `0x0100`, which was then written as `0x0100 << 8` and came out as 0 in new audio files.
