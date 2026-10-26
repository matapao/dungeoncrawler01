# Contributing

Use Node.js 24+ and `npm ci --ignore-scripts`, then `npm run verify`.
`npm run format` formats maintained files. `npm run audit` checks current dependency advisories.
Run the dev server and `npm run test:browser` for movement, camera, UI or rendering changes.
Set `CHROME_PATH` to use a non-default Chrome executable. Browser evidence goes to ignored `test-output/`.

The simulation owns commands, generated geometry, collisions and travel; rendering owns presentation.
Read [CONTRACT.md](CONTRACT.md) and [AGENTS.md](AGENTS.md). Keep changes focused and test behavior.
Current gameplay is a solo traversal Alpha; planned features are not acceptance claims.

The portable, browser, publication, test and build-tool compiler profiles inherit the mirrored strict baseline.
Vite is retained from the original td01 package. The standalone gate checks types, formatting, architecture,
headless behavior and build; the historical shared multi-project manifest guard does not register this new repo yet.
Use the installed vendored `@zirbel/engineering/browser` adapter for Chrome automation.

Keep third-party notices with assets and update [CREDITS.md](CREDITS.md) when media changes.
Do not add credentials, local settings, saved data, recordings or generated publication archives.
