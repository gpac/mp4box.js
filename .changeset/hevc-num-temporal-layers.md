---
'mp4box': patch
---

Read `numTemporalLayers` in `hvcC` and `lhvC` from all three of its bits. It was masked with `0xd`, so 2, 4 and 6 layers were read as 0 and 3, 5 and 7 as 1, and a rewritten `hvcC` kept the wrong value.
