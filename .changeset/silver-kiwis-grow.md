---
"jagajs": minor
---

feat: add data-* attribute support to sanitizer and fix multi-part attribute context detection

- `sanitize()` now passes `data-*` attributes by default (`allowDataAttrs: true`), enabling Alpine.js, HTMX, and other data-attribute-driven frameworks out of the box. Set `allowDataAttrs: false` to opt out.
- Replaced the single-regex context detector in `j` tag with `resolveContext()`, which builds a static prefix using `\x00` placeholders for prior substitutions. Fixes multi-part attributes (`href="${base}${path}"`), closed-tag text context, closing-tag bypass, and sequential attributes.
