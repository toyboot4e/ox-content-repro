// Asserts each reported bug against the built site (run `vite build` first;
// `pnpm check` does both). Prints BUG while broken, OK once fixed; exits
// non-zero if any BUG remains. The dev-server search check spawns `vite`.
import { spawn } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p) => readFileSync(p, 'utf8');
const results = [];
const report = (name, broken, detail) => results.push({ name, broken, detail });

// 1. TS-private class fields must not be documented.
const classPage = read('dist/api/lib/classes/Counter/index.html');
report(
  'private class fields leak into the docs',
  /property-count|property-step/.test(classPage),
  'dist/api/lib/classes/Counter/index.html lists `count` / `step`',
);

// The theme CSS shared by every page.
const assets = readdirSync('dist/assets').filter((f) => f.endsWith('.css'));
const css = assets.map((f) => read(join('dist/assets', f))).join('\n');

// 2. readonly badge: jammed markup + no styles for the member markup at all.
const typePage = read('dist/api/lib/type-aliases/CounterOptions/index.html');
// Fixed when the theme styles the badge (inline-block pill with its own
// margin) — the compact markup itself is fine once styled.
report(
  'readonly badge jammed against the member name',
  typePage.includes('ox-api-badge') && !css.includes('.ox-api-badge'),
  '`initial`readonly — no whitespace, and no .ox-api-badge rule in the theme',
);
const memberClasses = ['ox-api-badge', 'ox-api-entry__members-table', 'ox-api-entry__member-detail'];
report(
  'member markup ships without theme styles',
  memberClasses.some((c) => typePage.includes(c) && !css.includes(`.${c}`)),
  `${memberClasses.join(', ')} used by the page but unstyled`,
);

// 3. The param-type chip must not sit on the (dark) code-block palette.
const chipRule = css.match(/\.ox-api-entry__param-type\s*{[^}]*}/)?.[0] ?? '';
report(
  'param-type chip dark in light theme',
  chipRule.includes('--octc-color-code-bg') || chipRule.includes('#243556'),
  '.ox-api-entry__param-type builds on the code-block palette',
);

// 4. A link to a module's index page must not gain a phantom /index/ segment.
const rootPage = read('dist/api/index.html');
report(
  'module links rewritten to a nonexistent index/index.html page',
  rootPage.includes('lib/index/index.html'),
  'docs index links ./lib/index.md as ./lib/index/index.html',
);

// 5. /search-index.json must be served (as JSON) by the dev server.
// detached: killing the negative pid takes the whole group (pnpm AND vite);
// killing only the wrapper leaves vite squatting on the port for the next run.
const server = spawn('pnpm', ['exec', 'vite', '--port', '5399', '--strictPort'], {
  stdio: 'ignore',
  detached: true,
});
try {
  let body = '';
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await fetch('http://localhost:5399/search-index.json');
      body = await res.text();
      break;
    } catch {}
  }
  let isJson = false;
  try {
    isJson = Array.isArray(JSON.parse(body).documents);
  } catch {}
  report('search index unavailable on the dev server', !isJson, '/search-index.json served the html fallback');
} finally {
  process.kill(-server.pid, 'SIGTERM');
}

let failed = false;
for (const { name, broken, detail } of results) {
  console.log(`${broken ? 'BUG' : 'OK '} ${name}${broken ? ` — ${detail}` : ''}`);
  failed ||= broken;
}
process.exit(failed ? 1 : 0);
