---
'mp4box': patch
---

Build the constraint bytes of the VVC codec string in the bit order stored in `vvcC`. When `gci_present_flag` was set, two bits of each byte were taken from the wrong place and the last two bits were dropped, so the string did not match the stream.
