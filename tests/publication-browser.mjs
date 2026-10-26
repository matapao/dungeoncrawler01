import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { launchBrowser } from '../scripts/browser.ts';

const origin = new URL(process.argv[2] ?? 'http://localhost:5186/').origin;
const revision = process.argv[3];
if (!revision || !/^[a-f0-9]{64}$/.test(revision))
  throw new Error('Supply the reviewed 0.3.0 revision identity.');
const retained = JSON.parse(
  await readFile(new URL('../test-output/retained-dungeon-history.json', import.meta.url), 'utf8'),
);
assert.deepEqual(
  retained.map((item) => item.id),
  [
    'd9123871bd0c19b6f851cc02d426e0649582f29944e3f8b49ac0764c241dbe04',
    '9176bdde83e7a8dd38554b0b65b6353bb5da4dc9a270d619742ffa2ff35162a8',
  ],
);
// These are the exact host-owned additions; gameplay markup must remain unchanged.
function gameMarkup(html) {
  return html
    .replace(/<meta\s+name="zirbel-(?:stage|revision|branch)"[^>]*>/gi, '')
    .replace(/<link\s+rel="stylesheet"\s+href="\/play-tools\.css"[^>]*>/gi, '')
    .replace(/<script\s+type="module"\s+src="\/standalone-tools\.js"[^>]*><\/script>/gi, '')
    .replace(/<style>\.revision-nav[\s\S]*?<\/style>/gi, '')
    .replace(/<nav\s+class="revision-nav"[\s\S]*?<\/nav>/gi, '')
    .replace(/<a\s+class="solo-revisions"[\s\S]*?<\/a>/gi, '')
    .replace(/>\s+</g, '><')
    .trim();
}
const browser = await launchBrowser();
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
      console.error('Publication console error', page.url(), message.text());
    }
  });
  page.on('requestfailed', (request) =>
    console.error('Publication request failed', request.url(), request.failure()?.errorText),
  );
  page.on('response', (response) => {
    if (response.status() >= 400)
      console.error('Publication HTTP failure', response.status(), response.url(), 'from', page.url());
  });
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  if (!(await page.$('.slot[data-game="dungeoncrawler01"]'))) {
    const more = await page.$('#moreBtn');
    if (more) await more.click();
  }
  await page.waitForSelector('.slot[data-game="dungeoncrawler01"]');
  assert.equal(
    await page.$eval('.slot[data-game="dungeoncrawler01"] .release-stage', (element) => element.textContent),
    'Alpha',
  );
  const href = await page.$eval('a.box[data-game="dungeoncrawler01"]', (element) =>
    element.getAttribute('href'),
  );
  assert.equal(href, `/dungeoncrawler01/revisions/${revision}/`);
  await page.goto(new URL(href, origin).href, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#game[data-ready="true"]', { timeout: 60000 });
  assert.equal(await page.$eval('.layout-select', (element) => element.value), 'generated');
  const facts = await page.evaluate(async () => {
    const manifest = await fetch('./zirbel.json').then((response) => response.json());
    const credits = await fetch('./credits.html').then((response) => response.text());
    const document = new DOMParser().parseFromString(credits, 'text/html');
    const licences = [...document.querySelectorAll('a')]
      .map((anchor) => anchor.getAttribute('href'))
      .filter((href) => href?.startsWith('./') && href.endsWith('.txt'));
    const licenceResults = await Promise.all(
      licences.map(async (href) => ({ href, ok: (await fetch(href)).ok })),
    );
    const history = await fetch('/dungeoncrawler01/revisions/history.json').then((response) =>
      response.json(),
    );
    return { manifest, credits, licenceResults, history };
  });
  assert.equal(facts.manifest.version, '0.3.0');
  assert.equal(facts.manifest.stage, 'alpha');
  assert.deepEqual(facts.manifest.players, { min: 1, max: 1 });
  assert.match(facts.credits, /Kay Lousberg/);
  assert.equal(facts.licenceResults.length, 6);
  assert.ok(facts.licenceResults.every((result) => result.ok));
  assert.deepEqual(
    facts.history.revisions.map((item) => item.id),
    [...retained.map((item) => item.id), revision],
  );
  assert.deepEqual(
    facts.history.revisions.slice(0, 2).map((item) => item.source),
    retained.map((item) => item.source),
    'legacy provenance remains recorded as captured',
  );
  assert.equal(facts.history.revisions[2].source.branch, 'main');
  assert.equal(facts.history.revisions[2].source.author.name, 'bjstr');
  for (const item of retained) {
    // Captured games may fetch only within their own revision. Inspect each older alias in its own page.
    await page.goto(`${origin}/dungeoncrawler01/@${item.version}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#game[data-ready="true"]', { timeout: 60000 });
    const results = await page.evaluate(
      async ({ version, files }) => {
        const results = [];
        for (const [path, expected] of Object.entries(files)) {
          const target = `./${path}`;
          let response;
          try {
            response = await fetch(target);
          } catch (error) {
            throw new Error(`Retained request ${target}: ${String(error)}`);
          }
          if (!response.ok) throw new Error(`Retained file unavailable: ${path}`);
          const body = await response.arrayBuffer();
          const digest = await crypto.subtle.digest('SHA-256', body);
          results.push({
            path,
            actual: [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join(''),
            expected: expected.sha256,
            ...(path === 'index.html'
              ? { html: new TextDecoder().decode(body), expectedHtml: expected.html }
              : {}),
          });
        }
        return results;
      },
      { version: item.version, files: item.files },
    );
    for (const result of results) {
      if (result.path === 'index.html')
        assert.equal(
          gameMarkup(result.html),
          gameMarkup(result.expectedHtml),
          'only the host-owned presentation may change',
        );
      else assert.equal(result.actual, result.expected, `retained ${item.version}/${result.path}`);
    }
  }
  await page.goto(new URL(href, origin).href, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#game[data-ready="true"]', { timeout: 60000 });
  await page.click('.game-tools-revisions');
  await page.waitForSelector('.game-tools-history ol li');
  const links = await page.$$eval('.game-tools-history ol li > a', (anchors) =>
    anchors.map((anchor) => ({ text: anchor.textContent, href: anchor.getAttribute('href') })),
  );
  assert.equal(links.length, 3);
  assert.ok(links[0].text.includes('Two floors, working stairs and camera views'));
  assert.ok(links[1].text.includes('Rooms and routes'));
  assert.ok(links[2].text.includes('The first KayKit room'));
  for (const [link, expected] of [
    [links[2], null],
    [links[1], 'crossroads'],
    [links[0], 'generated'],
  ]) {
    await page.goto(new URL(link.href, origin).href, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#game[data-ready="true"]', { timeout: 60000 });
    assert.equal(await page.$eval('h1', (element) => element.textContent), 'The Gathering');
    if (expected === null) assert.equal(await page.$('.layout-select'), null);
    else assert.equal(await page.$eval('.layout-select', (element) => element.value), expected);
    await page.click('.game-tools-revisions');
    await page.waitForSelector('.game-tools-history ol li');
    assert.equal(await page.$$eval('.game-tools-history ol li', (items) => items.length), 3);
  }
  assert.deepEqual(errors, []);
  console.log(
    'PASS: Alpha shelf/current captured launch, six licences, both old game artifacts unchanged outside host presentation, three playable revisions and shared history navigation',
  );
} finally {
  await browser.close();
}
