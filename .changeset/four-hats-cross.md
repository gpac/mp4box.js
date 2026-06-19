---
'mp4box': patch
---

Fix import paths and add a test to verify the tarball is installable.

Release [v2.4.0](https://github.com/gpac/mp4box.js/releases/tag/v2.4.0) upgraded `tsdown`, which apparently changed the output extensions from `.js` to `.mjs` and from `.d.ts` to `.d.mts`. This made the package uninstallable because the import paths were not updated. This patch fixes those import paths and adds a test to verify that the tarball installs correctly.

fixes #561