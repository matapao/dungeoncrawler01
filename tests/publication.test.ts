import assert from 'node:assert/strict';
import { test } from 'node:test';
import { updateAlphaShelf } from '../publish/shelf.ts';

const before = {
  td01: { solo: '/td01/@0.2.0/', stage: 'alpha', manifest: { title: 'TD01' } },
  dungeoncrawler01: { solo: '/dungeoncrawler01/@0.1.0/', front: '/media/dungeoncrawler01/front.png' },
};
const shell = (media: unknown) =>
  `<html><script type="application/json" id="media">${JSON.stringify(media)}</script><footer>retained</footer></html>`;

test('an Alpha shelf update retains unrelated games and all surrounding page bytes', () => {
  const next = { solo: '/dungeoncrawler01/@0.2.0/', front: '/media/dungeoncrawler01/@0.2.0/front.png' };
  const output = updateAlphaShelf(shell(before), next, '0.2.0');
  const match = /id="media">([\s\S]*?)<\/script>/.exec(output);
  assert.ok(match?.[1]);
  const actual = JSON.parse(match[1]);
  assert.deepEqual(actual.td01, before.td01);
  assert.deepEqual(actual.dungeoncrawler01, next);
  assert.equal(
    output.replace(/id="media">[\s\S]*?<\/script>/, 'MEDIA'),
    shell(before).replace(/id="media">[\s\S]*?<\/script>/, 'MEDIA'),
  );
});

test('publication rejects changed boundaries and refuses republishing an existing launch', () => {
  assert.throws(() => updateAlphaShelf(shell(before), {}, '0.1.0'), /already/);
  assert.throws(() => updateAlphaShelf('<html></html>', {}, '0.2.0'), /boundary/);
  assert.throws(() => updateAlphaShelf(shell(before) + shell(before), {}, '0.2.0'), /boundary/);
  assert.throws(
    () => updateAlphaShelf(shell({ dungeoncrawler01: { solo: '/mutable/' } }), {}, '0.2.0'),
    /immutable/,
  );
});

test('shelf text cannot close the embedded media script', () => {
  const output = updateAlphaShelf(shell(before), { title: '</script><script>unsafe</script>' }, '0.2.0');
  assert.equal((output.match(/<script/g) ?? []).length, 1);
  assert.ok(output.includes('\\u003c/script>'));
});

test('publication preserves older games and retains server code solely through its immutable base image', async () => {
  const { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, resolve } = await import('node:path');
  const { execFileSync } = await import('node:child_process');
  const folder = mkdtempSync(join(tmpdir(), 'dc-alpha-publication-'));
  try {
    const live = join(folder, 'live');
    const build = join(folder, 'build');
    mkdirSync(live);
    mkdirSync(build);
    writeFileSync(join(live, 'index.html'), shell(before));
    writeFileSync(join(live, 'retained-game.txt'), 'existing public bytes');
    writeFileSync(join(build, 'index.html'), '<html><head></head><body>game</body></html>');
    writeFileSync(join(build, 'credits.html'), 'Kay Lousberg · CC0');
    const image = `registry.fly.io/zirbel@sha256:${'a'.repeat(64)}`;
    const serverHash = 'b'.repeat(64);
    const output = join(folder, 'prepared');
    const args = [
      resolve('publish/prepare.ts'),
      live,
      build,
      join(build, 'index.html'),
      join(build, 'index.html'),
      serverHash,
      image,
      output,
    ];
    execFileSync(process.execPath, args, { stdio: 'pipe' });
    const report = JSON.parse(readFileSync(join(output, 'publication.json'), 'utf8'));
    assert.equal(readFileSync(join(output, 'site', 'retained-game.txt'), 'utf8'), 'existing public bytes');
    assert.deepEqual(report.changedExistingFiles, ['index.html']);
    assert.equal(report.serverSha256, serverHash);
    const docker = readFileSync(join(output, 'Dockerfile'), 'utf8');
    assert.ok(docker.startsWith(`FROM ${image}\n`));
    assert.ok(docker.includes(`= "${serverHash}"`), 'image build checks retained server identity');
    assert.ok(!docker.includes('COPY network'), 'server code is inherited without export or substitution');
    const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
    const manifest = JSON.parse(
      readFileSync(join(output, 'site', 'dungeoncrawler01', `@${version}`, 'zirbel.json'), 'utf8'),
    );
    assert.equal(manifest.version, version);
    assert.deepEqual(manifest.players, { min: 1, max: 1 });
    assert.throws(() => execFileSync(process.execPath, args, { stdio: 'pipe' }), /Command failed/);
    writeFileSync(join(live, 'WITHDRAWN.txt'), 'Not deployable: recordings removed.');
    const withdrawnOutput = join(folder, 'withdrawn-rejected');
    assert.throws(
      () => execFileSync(process.execPath, [...args.slice(0, -1), withdrawnOutput], { stdio: 'pipe' }),
      (error: unknown) =>
        error instanceof Error && 'stderr' in error && /withdrawn/.test(String(error.stderr)),
    );
    assert.equal(
      existsSync(withdrawnOutput),
      false,
      'withdrawal rejects before creating any publication output',
    );
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test('game-only handoff carries pinned solo bytes and rejects recording-bearing builds', async () => {
  const { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, resolve } = await import('node:path');
  const { execFileSync } = await import('node:child_process');
  const { createHash } = await import('node:crypto');
  const folder = mkdtempSync(join(tmpdir(), 'dc-game-only-'));
  try {
    const build = join(folder, 'build');
    mkdirSync(build);
    writeFileSync(join(build, 'index.html'), '<html><head></head><body>game</body></html>');
    writeFileSync(join(build, 'credits.html'), 'Kay Lousberg · CC0');
    writeFileSync(join(build, 'LICENSE.txt'), 'MIT');
    writeFileSync(join(build, 'CREDITS.md'), 'Kay Lousberg · CC0');
    writeFileSync(join(build, 'three-LICENSE.txt'), 'three.js · MIT');
    const output = join(folder, 'prepared');
    const args = [
      resolve('publish/prepare-game.ts'),
      build,
      join(build, 'index.html'),
      join(build, 'index.html'),
      output,
    ];
    execFileSync(process.execPath, args, { stdio: 'pipe' });
    const report = JSON.parse(readFileSync(join(output, 'artifact.json'), 'utf8'));
    assert.equal(report.kind, 'standalone-game-only');
    assert.deepEqual(report.recordings, []);
    const snapshot = readFileSync(join(output, 'catalog/previews/dungeoncrawler01/solo.tgz'));
    assert.equal(snapshot.length, report.soloSnapshot.bytes);
    assert.equal(createHash('sha256').update(snapshot).digest('hex'), report.soloSnapshot.sha256);
    assert.equal(existsSync(join(output, 'site')), false, 'handoff never copies a mixed website');
    assert.equal(existsSync(join(output, 'Dockerfile')), false, 'platform owns deployment');
    writeFileSync(join(build, 'ambient.mp3'), 'unreviewed recording');
    const rejectedOutput = join(folder, 'rejected');
    assert.throws(
      () => execFileSync(process.execPath, [...args.slice(0, -1), rejectedOutput], { stdio: 'pipe' }),
      /Command failed/,
    );
    assert.equal(
      existsSync(join(rejectedOutput, 'artifact.json')),
      false,
      'a rejected build has no completed handoff identity',
    );
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
