# jagajs

## 1.5.0

### Minor Changes

- [`9f2cb30`](https://github.com/dgknbtl/jaga/commit/9f2cb3035140540bf678735e9890cec13aab9daf) Thanks [@dgknbtl](https://github.com/dgknbtl)! - feat: add data-\* attribute support to sanitizer and fix multi-part attribute context detection

  - `sanitize()` now passes `data-*` attributes by default (`allowDataAttrs: true`), enabling Alpine.js, HTMX, and other data-attribute-driven frameworks out of the box. Set `allowDataAttrs: false` to opt out.
  - Replaced the single-regex context detector in `j` tag with `resolveContext()`, which builds a static prefix using `\x00` placeholders for prior substitutions. Fixes multi-part attributes (`href="${base}${path}"`), closed-tag text context, closing-tag bypass, and sequential attributes.

## 1.4.3

### Patch Changes

- [`6efdb6a`](https://github.com/dgknbtl/jaga/commit/6efdb6a6a8c2451066cdaf5e79c71ccdfbc0d998) Thanks [@dgknbtl](https://github.com/dgknbtl)! - Fixed three security vulnerabilities: encoded protocol bypass in safeUrl, multi-argument url() bypass in CSS sanitizer, and insecure Math.random() fallback in nonce generation. Hardened release tooling with fail-fast error handling and robust CHANGELOG parsing.

## 1.4.2

### Patch Changes

- [`3bdd9fe`](https://github.com/dgknbtl/jaga/commit/3bdd9fe1649338978dc5a42dcc4531420398e5ed) Thanks [@dgknbtl](https://github.com/dgknbtl)! - Implemented refined Jaga Release Workflow and updated security rules with context-aware validation.
