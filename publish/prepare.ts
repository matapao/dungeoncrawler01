/** Prepare an additive Alpha update from a snapshot of the running website, never a dirty site build. */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { updateAlphaShelf } from './shelf.ts';

const [liveArg, buildArg, frontArg, roomArg, serverHashArg, imageArg, outArg] = process.argv.slice(2);
if (!liveArg || !buildArg || !frontArg || !roomArg || !serverHashArg || !imageArg || !outArg)
  throw new Error(
    'Usage: node publish/prepare.ts LIVE_SITE BUILD FRONT_PNG ROOM_PNG LIVE_SERVER_SHA256 IMAGE OUTPUT',
  );
if (!/^registry\.fly\.io\/zirbel@sha256:[a-f0-9]{64}$/.test(imageArg))
  throw new Error('The baseline image must be the deployed immutable Zirbel image.');
const live = resolve(liveArg);
const build = resolve(buildArg);
const out = resolve(outArg);
if (existsSync(join(live, 'WITHDRAWN.txt')))
  throw new Error(
    'This website baseline was withdrawn; prepare only the independently reviewed game artifact.',
  );
if (existsSync(out))
  throw new Error('Output must be a new directory; existing publication artifacts are preserved.');
const hash = (body: string | Uint8Array): string => createHash('sha256').update(body).digest('hex');
if (!/^[a-f0-9]{64}$/.test(serverHashArg)) throw new Error('Missing verified live server SHA-256.');

function files(folder: string, prefix = ''): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Symlink is not allowed in the publication: ${path}`);
    if (entry.isDirectory()) return files(join(folder, entry.name), path);
    if (!entry.isFile()) throw new Error(`Non-file in the publication: ${path}`);
    return [path];
  });
}

const baseline = new Map(files(live).map((path) => [path, hash(readFileSync(join(live, path)))]));
const buildFiles = files(build);
if (!buildFiles.includes('index.html')) throw new Error('The game build has no entry page.');
if (buildFiles.length > 1999) throw new Error('The standalone snapshot exceeds the file budget.');
const packageData: unknown = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
if (!packageData || typeof packageData !== 'object' || !('version' in packageData))
  throw new Error('Missing game version.');
const version = packageData.version;
if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid game version.');
const id = 'dungeoncrawler01';
const launch = `/${id}/@${version}/`;
const manifest = {
  id,
  version,
  stage: 'alpha',
  title: 'DungeonCrawler01',
  tagline: 'Explore a generated two-floor KayKit dungeon with working stairs and five camera views.',
  players: { min: 1, max: 1 },
  runsOn: 'Desktop browser · solo Alpha',
  madeBy: { name: 'bestrand', url: 'https://github.com/bestrand' },
  credits: [
    {
      slot: 'Models',
      artist: 'Kay Lousberg',
      work: 'KayKit',
      url: 'https://kaylousberg.com',
      license: 'CC0-1.0',
    },
    {
      slot: 'Credits and licences',
      work: 'Models, engine and fonts',
      url: `https://zirbel.app${launch}credits.html`,
    },
  ],
};
const site = join(out, 'site');
cpSync(live, site, { recursive: true });
const game = join(site, id, `@${version}`);
if (existsSync(game)) throw new Error('This immutable game version is already published.');
cpSync(build, game, { recursive: true });
writeFileSync(join(game, 'zirbel.json'), JSON.stringify(manifest, null, 2) + '\n');
const gameHtml = readFileSync(join(game, 'index.html'), 'utf8');
if (gameHtml.includes('src="/standalone-tools.js"'))
  throw new Error('The input build already has site chrome.');
writeFileSync(
  join(game, 'index.html'),
  gameHtml
    .replace(
      '</head>',
      '<link rel="stylesheet" href="/play-tools.css"><script type="module" src="/standalone-tools.js"></script></head>',
    )
    .replace(
      '</body>',
      `<a class="solo-revisions" style="position:fixed;top:14px;left:110px;z-index:65;color:#f2efe7;background:#211b38e8;padding:9px 14px;border-radius:100px;font:600 12px system-ui" href="/${id}/revisions/">Revisions</a></body>`,
    ),
);
const media = join(site, 'media', id, `@${version}`);
if (existsSync(media)) throw new Error('This immutable version already has published media.');
mkdirSync(media, { recursive: true });
cpSync(resolve(frontArg), join(media, 'front.png'));
cpSync(resolve(roomArg), join(media, 'back-1.png'));
if (!existsSync(join(game, 'credits.html')))
  throw new Error('The Alpha must include the reviewed credits page.');
const packedFiles = files(game);
const packedBytes = packedFiles.reduce((total, path) => total + statSync(join(game, path)).size, 0);
if (packedBytes > 128 * 1024 * 1024) throw new Error('Uncompressed standalone snapshot exceeds 128 MiB.');
execFileSync(
  'tar',
  ['--format', 'ustar', '--no-xattrs', '-czf', join(media, 'solo.tgz'), '-C', game, ...packedFiles],
  {
    env: { ...process.env, COPYFILE_DISABLE: '1' },
  },
);
const archive = readFileSync(join(media, 'solo.tgz'));
if (archive.length > 128 * 1024 * 1024) throw new Error('Standalone snapshot exceeds 128 MiB.');
const back = [
  'Step into a quiet fantasy hub and find your way to the Friends tunnel.',
  'Choose a seed and explore a small generated dungeon built from reusable KayKit sections.',
  'Walk up and down real stairs connecting two floors, then find the upper-floor goal.',
  'Try follow, angled, overhead and sliced-building views with familiar walking controls.',
  'Return to the hub to try another seed or revisit the earlier layouts and reference pieces.',
];
const entry = {
  solo: launch,
  stage: 'alpha',
  front: `/media/${id}/@${version}/front.png`,
  shots: [
    { src: `/media/${id}/@${version}/back-1.png`, caption: 'Two floors, working stairs and camera views' },
  ],
  focus: [0.5, 0.5],
  back,
  manifest,
};
const html = readFileSync(join(site, 'index.html'), 'utf8');
writeFileSync(join(site, 'index.html'), updateAlphaShelf(html, entry, version));
const unchanged = [...baseline].filter(([path]) => path !== 'index.html');
for (const [path, digest] of unchanged)
  if (hash(readFileSync(join(site, path))) !== digest) throw new Error(`An existing page changed: ${path}`);
writeFileSync(
  join(out, 'Dockerfile'),
  `FROM ${imageArg}\nRUN test "$(sha256sum /app/network.mjs | cut -d ' ' -f 1)" = "${serverHashArg}"\nRUN rm -rf /app/site\nCOPY site /app/site\n`,
);
writeFileSync(join(out, '.dockerignore'), '**\n!Dockerfile\n!site\n!site/**\n');
const report = {
  game: id,
  version,
  stage: 'alpha',
  launch: `https://zirbel.app${launch}`,
  preservedExistingFiles: unchanged.length,
  changedExistingFiles: ['index.html'],
  serverSha256: serverHashArg,
  baselineImage: imageArg,
  baselineIndexSha256: baseline.get('index.html'),
  alphaIndexSha256: hash(readFileSync(join(site, 'index.html'))),
  soloSnapshot: { bytes: statSync(join(media, 'solo.tgz')).size, sha256: hash(archive) },
};
writeFileSync(join(out, 'publication.json'), JSON.stringify(report, null, 2) + '\n');
const catalog = join(out, 'catalog-delta', id);
mkdirSync(catalog, { recursive: true });
writeFileSync(join(catalog, 'zirbel.json'), JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(
  join(catalog, 'cover.json'),
  JSON.stringify(
    {
      stage: 'alpha',
      back,
      focus: entry.focus,
      shots: entry.shots.map((shot) => shot.caption),
      soloSnapshot: report.soloSnapshot,
    },
    null,
    2,
  ) + '\n',
);
for (const file of ['front.png', 'back-1.png', 'solo.tgz']) cpSync(join(media, file), join(catalog, file));
console.log(JSON.stringify(report, null, 2));
