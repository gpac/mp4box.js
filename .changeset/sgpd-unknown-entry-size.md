---
'mp4box': patch
---

Stop parsing `sgpd` entries of an unknown grouping type when the box gives no entry size (version 0 or 2). Before, each such entry read 0 bytes, so a large `entry_count` looped until the heap ran out.
