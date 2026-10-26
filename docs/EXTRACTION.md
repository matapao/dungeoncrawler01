# Standalone extraction

Extracted on 2026-10-26 from the existing uncommitted `td01/DungeonCrawler01` source.
The original package had no separate Git history. Camera, math and seeded RNG are retained under
the parent MIT license. Only the ten model/font/license files selected by the original build were copied.
Historical playcheck and release documents describe their original environment and retain that evidence.

The repository has its own npm manifest/lockfile, strict compiler profiles, formatter, browser adapter,
selected assets and CI. Publication helpers prepare immutable candidates; they do not publish them.
The original ignored dist, screenshots and publication staging are preserved in a private local backup
outside both repositories. They are not inputs to installation or build and must not be added to source.

The copied shared engineering documents are historical mirrors. Vite remains the inherited build choice;
this repo's actual compiler profiles and gate are listed in CONTRIBUTING.md until canonical registration.
