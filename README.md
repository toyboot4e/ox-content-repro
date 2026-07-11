# API-docs minimum repro

Reproduces four bugs in ox-content's generated API reference, using the
workspace's own build (`link:` deps on `../crates/ox_content_napi` and
`../npm/vite-plugin-ox-content`). Build both first:

```sh
pnpm -w install
(cd ../crates/ox_content_napi && pnpm run build:debug)
(cd ../npm/vite-plugin-ox-content && pnpm build)
pnpm install
pnpm check   # vite build + assertions; BUG lines show what is broken
```

All four bugs are exercised by the one entry `src/lib.ts` (a class, a type
alias, a function).

1. **TS-`private` class fields leak into the docs.** `Counter`'s `count` and
   `step` are `private`, and the docs default is `private: false` — yet both
   appear as documented Properties. The extractor only honors the JSDoc
   `@private` tag (`should_skip_by_visibility`), never the TypeScript
   accessibility modifier.
2. **`readonly` badge jammed against the member name.** The members table
   emits `<code>initial</code><span class="ox-api-badge">readonly</span>` —
   no whitespace — and the built-in theme has no `.ox-api-badge` rule, so it
   renders as `initial`readonly.
3. **Member markup ships without theme styles.** Everything under the
   "Members" section (`ox-api-entry__members-table`, `__member-detail`,
   `__member-description`, `__member-params`, …) has no CSS in the built-in
   theme: raw heading soup and unstyled tables on every class/interface/type
   page. (Bug 2 is one symptom of this.)
4. **Param-type chip dark in light theme.** `.ox-api-entry__param-type` (the
   `CounterOptions` chip on `createCounter`'s page) builds on
   `--octc-color-code-bg` — dark by design even in the light palette — plus a
   hardcoded `#243556`, so the chip renders as a dark pill on light pages.
5. **Search index unavailable on the dev server.** `search-index.json` is
   written only by the static build (`closeBundle`); the dev server registers
   no handler for it, so the fetch falls through to the html fallback and the
   search UI reports the index unavailable. (`pnpm dev`, then request
   `/search-index.json`.)
