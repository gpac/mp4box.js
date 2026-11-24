---
'mp4box': patch
---

Write the 4 reserved bits before `min_spatial_segmentation_idc` in `hvcC` as `1111`, as ISO/IEC 14496-15 requires.
