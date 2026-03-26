# 🛡️ Jaga

[![npm version](https://img.shields.io/npm/v/jagajs.svg?style=flat-square)](https://www.npmjs.com/package/jagajs)
[![bundle size](https://img.shields.io/bundlephobia/minzip/jagajs?label=size&style=flat-square)](https://bundlephobia.com/result?p=jagajs)
[![license](https://img.shields.io/npm/l/jagajs.svg?style=flat-square)](https://github.com/dgknbtl/jaga/blob/main/LICENSE)
[![typed](https://img.shields.io/badge/types-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)

**Jaga** (named after the word for _"guard"_ or _"protect"_) is an ultra-lightweight, zero-dependency engine that brings **Context-Aware Security** to your HTML templates. It's the invisible guardian between your user's data and your application's DOM.

> "Stop manually escaping. Stop overthinking XSS. Just let Jaga guard your templates."

---

## Features

- **Smart Context Awareness**: Automatically identifies if data is in a `<div>`, an `href`, or an `onclick`.
- **Built-in URL Sanitization**: Proactively blocks `javascript:` and other dangerous protocols.
- **HTML Sanitizer**: SSR-native allowlist sanitizer (`jagajs/sanitize`) — zero dependencies, works in Node.js, Bun, Deno.
- **Smart Minifier**: Automatically cleans up unnecessary whitespace between HTML tags (intelligent enough to preserve `<pre>` and `<textarea>`).
- **DX Guardrails**: Helpful console warnings during development when a security risk or non-CSP-compliant pattern is detected.
- **Nano-sized**: Less than **1KB** gzipped. No dependencies, no bloat.
- **Trusted Types Native**: Built-in support for the browser's native `TrustedHTML` API.
- **CSP Ready**: Cryptographically strong `nonce()` helper included for secure inline scripts.

## Installation

```bash
npm install jagajs
```

## Quick Start

```javascript
import { j } from "jagajs";

// 1. Text is automatically escaped
const userInp = "<img src=x onerror=alert(1)>";
const title = j`<h1>Welcome, ${userInp}</h1>`;
// Result: <h1>Welcome, &lt;img src=x...&gt;</h1>

// 2. Dangerous protocols are blocked in URLs
const url = "javascript:alert('XSS')";
const link = j`<a href="${url}">Click Me</a>`;
// Result: <a href="about:blank">...</a> (and a dev-warning in console!)

// 3. Attribute breakouts are prevented
const id = 'my-id" onclick="alert(1)';
const div = j`<div id="${id}"></div>`;
// Result: <div id="my-id&quot; onclick=&quot;alert(1)&quot;"></div>
```

### Advanced: List Rendering

Jaga handles arrays seamlessly and securely:

```javascript
const items = ["Safe", "<b>Bold</b>", "<i>Italic</i>"];
const list = j`<ul>${items.map((i) => j`<li>${i}</li>`)}</ul>`;
```

### Secure JSON for `<script>`

Inject JSON data safely into scripts without worrying about `</script>` breakouts:

```javascript
const data = { user: "Admin", bio: "</script><script>alert(1)</script>" };
const script = j`<script>window.DATA = ${j.json(data)};</script>`;
```

### Secure Nonce for CSP

```javascript
import { j, nonce } from "jagajs";

const myNonce = nonce();
const script = j`<script nonce="${myNonce}">console.log('Safe script');</script>`;
```

### HTML Sanitizer (SSR-Ready)

Strip dangerous tags and attributes from rich text, with zero dependencies — works in Node.js, Bun, and Deno:

```javascript
import { sanitize } from "jagajs/sanitize";

// Safe rich text from a WYSIWYG editor
const clean = sanitize(userHtml);

// Custom allowlist
const strict = sanitize(userHtml, {
  allowedTags: ["b", "i", "a", "p"],
  allowedAttrs: { "a": ["href", "title"] },
});

// Combine with Jaga core
import { j } from "jagajs";
const html = j`<article>${sanitize(richText)}</article>`;
```

---

## License

MIT © [Dogukan Batal](https://github.com/dgknbtl)
