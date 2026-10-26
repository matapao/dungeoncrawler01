/** Prepare only DungeonCrawler01. The platform owner publishes its recording-free shelf. */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const [buildArg, frontArg, roomArg, outArg] = process.argv.slice(2);
if (!buildArg || !frontArg || !roomArg || !outArg)
  throw new Error('Usage: node publish/prepare-game.ts BUILD FRONT_PNG ROOM_PNG OUTPUT');
const out = resolve(outArg);
if (existsSync(out)) throw new Error('Existing artifacts are immutable; choose a new output folder.');
const manifest: unknown = JSON.parse(readFileSync(new URL('../zirbel.json', import.meta.url), 'utf8'));
const packageData: unknown = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
if (
  !manifest ||
  typeof manifest !== 'object' ||
  !('id' in manifest) ||
  manifest.id !== 'dungeoncrawler01' ||
  !('version' in manifest) ||
  typeof manifest.version !== 'string' ||
  !/^\d+\.\d+\.\d+$/.test(manifest.version) ||
  !('stage' in manifest) ||
  manifest.stage !== 'alpha' ||
  !packageData ||
  typeof packageData !== 'object' ||
  !('version' in packageData) ||
  packageData.version !== manifest.version
)
  throw new Error('The source manifest and package must identify the same Alpha version.');
const version = manifest.version;
const players: unknown = 'players' in manifest ? manifest.players : undefined;
if (
  !players ||
  typeof players !== 'object' ||
  !('min' in players) ||
  players.min !== 1 ||
  !('max' in players) ||
  players.max !== 1
)
  throw new Error('This Alpha supports one player.');
function files(folder: string, prefix = ''): string[] {
  return readdirSync(folder, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new Error('Artifact links are forbidden.');
      if (entry.isDirectory()) return files(join(folder, entry.name), relative);
      if (!entry.isFile()) throw new Error('Only regular artifact files are allowed.');
      return [relative];
    });
}
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const game = join(out, 'game');
cpSync(resolve(buildArg), game, { recursive: true });
writeFileSync(join(game, 'zirbel.json'), JSON.stringify(manifest, null, 2) + '\n');
const paths = files(game);
for (const required of ['index.html', 'credits.html', 'LICENSE.txt', 'CREDITS.md', 'three-LICENSE.txt'])
  if (!paths.includes(required)) throw new Error(`Missing required playable attribution: ${required}`);
const recordings = paths.filter((path) =>
  /\.(?:mp3|wav|ogg|oga|m4a|flac|aac|aiff|opus|mp4|webm)$/i.test(path),
);
if (recordings.length) throw new Error(`Recordings require redistribution review: ${recordings.join(', ')}`);
const bytes = paths.reduce((sum, path) => sum + statSync(join(game, path)).size, 0);
if (paths.length > 2000 || bytes > 128 * 1024 * 1024)
  throw new Error('Standalone file or byte budget exceeded.');
const catalog = join(out, 'catalog', 'previews', 'dungeoncrawler01');
mkdirSync(catalog, { recursive: true });
writeFileSync(join(catalog, 'zirbel.json'), JSON.stringify(manifest, null, 2) + '\n');
cpSync(resolve(frontArg), join(catalog, 'front.png'));
cpSync(resolve(roomArg), join(catalog, 'back-1.png'));
execFileSync(
  'tar',
  ['--format', 'ustar', '--no-xattrs', '-czf', join(catalog, 'solo.tgz'), '-C', game, '--', ...paths],
  {
    env: { ...process.env, COPYFILE_DISABLE: '1' },
  },
);
const archive = readFileSync(join(catalog, 'solo.tgz'));
if (archive.length > 128 * 1024 * 1024) throw new Error('Compressed standalone byte budget exceeded.');
const soloSnapshot = { bytes: archive.length, sha256: hash(archive) };
const cover = {
  stage: 'alpha',
  back: [
    'Step into a quiet fantasy hub and find your way to the Friends tunnel.',
    'Choose a seed and explore a small generated dungeon built from reusable KayKit sections.',
    'Walk up and down real stairs connecting two floors, then find the upper-floor goal.',
    'Try follow, angled, overhead and sliced-building views with familiar walking controls.',
    'Return to the hub to try another seed or revisit the earlier layouts and reference pieces.',
  ],
  focus: [0.5, 0.5],
  shots: ['Two floors, working stairs and camera views'],
  soloSnapshot,
};
writeFileSync(join(catalog, 'cover.json'), JSON.stringify(cover, null, 2) + '\n');
const report = {
  kind: 'standalone-game-only',
  id: 'dungeoncrawler01',
  version,
  stage: 'alpha',
  title: 'Two floors, working stairs and camera views',
  launch: `https://zirbel.app/dungeoncrawler01/@${version}/`,
  soloSnapshot,
  recordings,
  uncompressedBytes: bytes,
  files: Object.fromEntries(paths.map((path) => [path, hash(readFileSync(join(game, path)))])),
};
writeFileSync(join(out, 'artifact.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
