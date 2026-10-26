/** Run retained rooms and the generated dungeon serially, forwarding the same target URL. */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

for (const script of ['browser.mjs', 'phase3-browser.mjs']) {
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL(script, import.meta.url)), ...process.argv.slice(2)],
    { stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
