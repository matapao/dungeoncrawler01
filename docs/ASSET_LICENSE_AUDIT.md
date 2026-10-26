# Asset and license audit

Reviewed 2026-10-26 against the standalone source. This inventory distinguishes the original MIT
code from third-party material; the root license does not replace third-party licenses.

## Asset inventory

The entire `public/` tree contains three GLB model/animation bundles, two WOFF2 fonts and five
license notices. GLB textures are embedded in the same bundles. No recording, video, stock artwork,
source Blender archive or old publication snapshot is included in source. Ignored screenshots and
publication staging are excluded. The following SHA-256 inventory covers every supplied asset/notice.

| File                                                              |     Bytes | License        | SHA-256                                                            | Provenance                                                 |
| ----------------------------------------------------------------- | --------: | -------------- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| `public/assets/characters2/Knight.glb`                            |   339,272 | CC0-1.0        | `63ddeea66586f9aa0704ebf6b05fe3547172830982685b3e71b88e925d9c0dbb` | Kay Lousberg / KayKit; bundled collection and pack notices |
| `public/assets/characters2/anims_medium.glb`                      | 3,337,664 | CC0-1.0        | `ef69a98bc7d326eab886113356121c06e3b7f8d09eba106052e8c2ec41d2b096` | Kay Lousberg / KayKit; bundled collection and pack notices |
| `public/assets/kits/dungeon.glb`                                  | 4,629,812 | CC0-1.0        | `420013c1f5a4d5372f3f68b2b8d4cc3fb7487087aa03b02e8b7d05cecf8c91c0` | Kay Lousberg / KayKit; bundled collection and pack notices |
| `public/assets/licenses/KayKit-Character-Pack-Adventures-1.0.txt` |       891 | License notice | `ae322141814056dda0deea7540d74c41d87aee1da319977cd1bd84ee5a923629` | Original upstream notice retained verbatim                 |
| `public/assets/licenses/KayKit-Complete-Collection-v7.txt`        |     1,820 | License notice | `f11e6fb5ce17e1354241b5adbb50aef513cc0a16aa8b8230f11e71dcb2902d77` | Original upstream notice retained verbatim                 |
| `public/assets/licenses/KayKit-Dungeon-Remastered-1.0.txt`        |       829 | License notice | `c5f17abf619731f57f6bbff450f6484214605c13aa96bb75bbcfc70930941ff7` | Original upstream notice retained verbatim                 |
| `public/fonts/alegreya/OFL.txt`                                   |     4,395 | License notice | `f6f60d5d4cf4f4b1fc4e41353c897a2f5a16e6396c0cd8fa8bdfd2f4586a9a68` | Original upstream notice retained verbatim                 |
| `public/fonts/alegreya/alegreya-latin-wght.woff2`                 |    43,420 | OFL-1.1        | `34d902fd33b23ea3205daf8dd7696e6c49b50165e70165655e361f243dd3e083` | Font project authors; adjacent OFL.txt                     |
| `public/fonts/cinzel/OFL.txt`                                     |     4,383 | License notice | `f2b3029aba64c378bf0963b62945eee15e564fe4330b934c8f2eb058282b5e83` | Original upstream notice retained verbatim                 |
| `public/fonts/cinzel/cinzel-latin-wght.woff2`                     |    25,888 | OFL-1.1        | `ef95296c778719c3d658a8284d65078100450948851b9114485ada01d9d3d3f8` | Font project authors; adjacent OFL.txt                     |

## Source and permission records

KayKit's creator identifies the [Dungeon pack](https://kaylousberg.itch.io/kaykit-dungeon-pack),
[Adventurers](https://kaylousberg.itch.io/kaykit-adventurers) and
[Complete Collection](https://kaylousberg.itch.io/kaykit-complete) as CC0. The included historical
pack notices apply to the actual extracted files. Purchasing a collection or obtaining it from
itch.io does not replace that explicit license. Creator attribution is retained in CREDITS.md and
credits.html. The three models/animations match the verified td01 inputs byte for byte.

Cinzel and Alegreya retain the SIL Open Font License 1.1 and their original copyright notices.
They must not be relabelled MIT. Their source projects are linked in [CREDITS.md](../CREDITS.md).
The [official OFL](https://openfontlicense.org/open-font-license-official-text/) controls the fonts.

Original game code, the extracted TD01 camera/math/seed implementation and original documentation
retain MIT. The two vendored Zirbel archives declare MIT; core includes its own notice and the
matching engineering notice is retained beside the archive in [vendor](../vendor/NOTICE.md).
Neither archive bundles model, font, audio or video assets or npm dependencies.

`node_modules/` is not part of the repository. The installed three.js engine is MIT and its notice
is copied into builds. Build and test dependencies, including TypeScript and Puppeteer, retain their
upstream licenses; declaring an npm dependency does not relicense it under this repository's MIT license.

## Publication policy

The source code is MIT. Third-party assets are retained with their original permissions and notices:
CC0 models/animations and OFL fonts. No recording or unverified prototype asset is included.
The OFL files are distributed with their family copyright/license texts, not under MIT.
No font modification or renaming is claimed. The code license explicitly excludes these third-party files.

The original private checkout/history is kept separately; the public game source starts with one
root commit by the Matapao App bot. Earlier mixed-site publication archives are not source inputs.

## README logo

`docs/cartridge.png` reuses the actual cartridge from [Zirbel](https://zirbel.app/), exported
from its existing front-face markup, styles and painted key art. Only the Alpha/Beta badge is
aligned with this repository’s Status. The README displays the cartridge at 112 pixels wide.
The cartridge layout is from Zirbel’s `packages/web/lib/cover.ts` and site styles; retain
[its MIT notice](ZIRBEL_CARTRIDGE_LICENSE.txt). The image includes rendered lettering, not font
software; the SIL OFL does not require documents or artwork produced with a font to use OFL.
The pictured dungeon uses KayKit CC0 artwork; its original notices and creator credits remain in `CREDITS.md` and `public/assets/licenses/`.
