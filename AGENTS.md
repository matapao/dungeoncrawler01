# Working on dungeoncrawler01

- Read README.md, CONTRACT.md, docs/engineering/STANDARD.md and docs/engineering/ADOPTION.md before coding.
- Preserve unrelated work. Use parallel agents for independent work and coordinate file ownership.
- Portable rules live in src/game and src/core; only the simulation mutates gameplay. Views and UI submit commands.
- Keep rules deterministic, browser-safe and free of DOM, rendering, storage and transport imports.
- Keep new application modules under 600 lines. Use the existing camera, seed generator and asset set.
- Add behavior regression tests for bugs. Run npm run check before handoff; run npm run test:browser for visible changes.
- Own and dispose timers, listeners, animation and GPU resources. Stopped owners must stay stopped.
- Keep README.md at most 50 lines and retain asset and font provenance and licenses.
- No automatic commit, push, deployment or public visibility changes. Report checks and material limits honestly.
