# CLAUDE.md

Guidance for working in the **jagajs** repository.

## What this is

Jaga is an ultra-lightweight, **zero-dependency**, context-aware XSS protection engine for HTML
templates. It secures the boundary between user data and the DOM by escaping based on *where* the
data lands (text / attribute / URL / CSS), plus an SSR-native allowlist HTML sanitizer. Published to
npm as `jagajs`. Isomorphic: runs in Node ≥15, Bun, Deno, and all modern browsers.

Read [MANIFESTO.md](MANIFESTO.md) for the philosophy — every change must align with it.

## Commands

```bash
npm test            # vitest run — full suite (happy-dom env)
npx vitest run tests/sanitize.test.ts   # single test file
npm run typecheck   # tsc --noEmit — type-check only (this is the "lint"; there is no ESLint)
npm run build       # vite build + emit .d.ts → dist/  (injects __VERSION__)
npm run size        # gzip-size gate: index.js < 3KB, sanitize.js < 2.5KB (run after build)
npm run showcase    # vite dev server for the interactive showcase
npm run dev         # vite dev server
```

Before considering a change done: `npm run typecheck && npm test`, and if `src/` changed,
`npm run build && npm run size`. CI runs exactly these gates.

## Architecture

Two independent entry points (kept separate so consumers only pay for what they import):

| Entry | npm path | Source |
| --- | --- | --- |
| Core `j` tag + utils | `jagajs` | [src/index.ts](src/index.ts) |
| HTML sanitizer | `jagajs/sanitize` | [src/sanitize.ts](src/sanitize.ts) → [src/sanitize/index.ts](src/sanitize/index.ts) |

Layout:
- **[src/core/](src/core/)** — shared primitives. `escape.ts` (the context-aware escaping engine +
  `warn`), `css.ts` (lexical CSS sanitizer: char-level state machine + typed AST), `policy.ts`
  (Trusted Types policy, named `jaga`), `types.ts` (the `JagaHTML` wrapper class), `utils.ts`
  (`unsafe`, `nonce`, `secureJSON`).
- **[src/tags/template.ts](src/tags/template.ts)** — the `j` tagged-template handler. `resolveContext()`
  is the heart: it rebuilds a static prefix with `\x00` placeholders for prior substitutions, then
  decides each interpolation's context (text / attr / url / css) from tag/quote structure. URL attrs:
  `href, src, action, formaction, data`. `style` → css context.
- **[src/sanitize/index.ts](src/sanitize/index.ts)** — allowlist sanitizer built as a hand-written
  character state machine (`TEXT`, `ATTR_VAL_D`, `RAWTEXT`, …). No DOM, no regex parsing of HTML.

Data flow: user value → `escapeHTML(value, context)` → wrapped in `JagaHTML`. In browsers with
Trusted Types, output also carries a `TrustedHTML` via the `jaga` policy (`.toTrusted()`).

## Non-negotiable rules

- **Zero dependencies.** Never add a runtime dependency to core or sanitizer. Dev-only deps only.
- **Bundle budget (gzipped, per entry):** `jagajs` < 3KB, `jagajs/sanitize` < 2.5KB. Each entry
  bundles core, so they're measured independently — enforced by `npm run size` after `npm run build`.
  Check on anything that touches `src/`.
- **Isomorphic.** No bare `window`/`document`/`process`. Guard with `typeof x === 'undefined'` (see
  `policy.ts` and the `JAGA_DEV` check in `escape.ts`). Core must work as a pure string builder in SSR.
- **Always return `JagaHTML`**, never a raw string, from any public function that produces HTML. This
  is what prevents double-escaping when nested in `j`.
- **Context-aware, not escape-everything.** Decide the injection context first, then apply the
  matching rule. Don't add blanket escaping that breaks a context.
- **Trusted Types compatibility** must be preserved for browser output (policy name `jaga`), with a
  string fallback in SSR / unsupported environments.
- **Minification-friendly TS.** No `enum` (use union types / POJOs). Prefer primitive `for` loops and
  `charCodeAt`/char-level scanning over heavy or chained regexes in hot paths.
- **Explicit types** on all params and return values (`strict` is on).

## Conventions

- **ESM with explicit `.js` extensions** in relative imports (e.g. `import { JagaHTML } from
  './core/types.js'`) even though the source is `.ts`. Match this — `moduleResolution: bundler`,
  output is `.js`.
- **Dev warnings**: use `warn(...)` from `core/escape.ts`. It only logs when `NODE_ENV !==
  'production'`. Warnings should guide users toward CSP-compliant patterns, never silently weaken
  security.
- `nonce()` requires Web Crypto (hence Node ≥15) — it throws if unavailable; don't add an insecure
  fallback.

## Testing

- Vitest, `happy-dom` environment, files in [tests/](tests/) as `*.test.ts`.
- **Malicious-payload mandate**: every feature or fix MUST add tests with real attack vectors
  (`javascript:` URIs, attribute breakout `">`, SVG `onload`, `</script>` breakout, double/encoded
  bypasses, CSS `url(javascript:...)`). Prove the bypass is closed, don't just test the happy path.
- Assert on `.toString()` of the `JagaHTML` result. Cover context-switching and double-escaping edges.

## When a change ships

1. Keep [README.md](README.md) (features + comparison/support tables) in sync.
2. Reflect functional changes in the [showcase/](showcase/) — both SSR and client (Trusted Types) examples.
3. **Add a changeset** (`npx changeset`) and write its summary as the release note — name the attack
   vector / context for security fixes. That summary becomes the CHANGELOG and GitHub release verbatim.

## Releases (automated)

Fully automated via Changesets + GitHub Actions. You never run `npm publish`, `changeset version`,
or `git push --tags` by hand — and never hand-edit the version in `package.json`.

Flow:
1. Every PR is gated by CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)):
   `typecheck · test · build · size` on Node 20 & 22.
2. A merged PR that carries a changeset causes
   [.github/workflows/release.yml](.github/workflows/release.yml) to open/update a **"Version
   Packages"** PR (bumps `package.json` + writes `CHANGELOG.md`).
3. **Merging that PR is the release trigger.** CI then builds with the bumped version and publishes
   to npm **tokenlessly via OIDC trusted publishing**, with **provenance** generated automatically,
   then creates the git tag and GitHub release (notes = the CHANGELOG entry).

Write changeset summaries as the release note — for security fixes, name the attack vector and the
affected function/context. There is no post-release enrichment step; release-note quality lives in
the changeset.

**One-time setup** (before the first automated release):
- npm **trusted publishing** for `jagajs` on npmjs.com → package Settings → Trusted Publisher:
  Publisher *GitHub Actions*, org/user `dgknbtl`, repo `jaga`, workflow `release.yml`, environment
  *(blank)*, allowed action *npm publish*. No `NPM_TOKEN` secret needed; `publishConfig.provenance`
  is already set. The release workflow upgrades npm to ≥ 11.5.1 (the OIDC requirement).
</content>
