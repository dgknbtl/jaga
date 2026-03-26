# 🛡️ Jaga

[![npm version](https://img.shields.io/npm/v/jaga.svg?style=flat-square)](https://www.npmjs.com/package/jaga)
[![bundle size](https://img.shields.io/bundlephobia/minzip/jaga?label=size&style=flat-square)](https://bundlephobia.com/result?p=jaga)
[![license](https://img.shields.io/npm/l/jaga.svg?style=flat-square)](https://github.com/dogukanbatal/jaga/blob/main/LICENSE)
[![typed](https://img.shields.io/badge/types-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)

**Jaga** (named after the word for *"guard"* or *"protect"*) is an ultra-lightweight, zero-dependency engine that brings **Context-Aware Security** to your HTML templates. It's the invisible guardian between your user's data and your application's DOM.

> "Stop manually escaping. Stop overthinking XSS. Just let Jaga guard your templates."

---

## ✨ Features

- 🧠 **Smart Context Awareness**: Automatically identifies if data is in a `<div>`, an `href`, or an `onclick`.
- 🛡️ **Built-in URL Sanitization**: Proactively blocks `javascript:` and other dangerous protocols.
- ⚠️ **DX Guardrails**: Helpful console warnings during development when a security risk is neutralized.
- 🪶 **Nano-sized**: Less than **1KB** gzipped. No dependencies, no bloat.
- 🌍 **Trusted Types Native**: Built-in support for the browser's native `TrustedHTML` API.
- 🔐 **CSP Ready**: Cryptographically strong `nonce()` helper included for secure inline scripts.

## 📦 Installation

```bash
npm install jaga
```

## 🛠️ Quick Start

```javascript
import { j } from 'jaga';

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
const items = ['Safe', '<b>Bold</b>', '<i>Italic</i>'];
const list = j`<ul>${items.map(i => j`<li>${i}</li>`)}</ul>`;
```

### Secure Nonce for CSP

```javascript
import { j, nonce } from 'jaga';

const myNonce = nonce();
const script = j`<script nonce="${myNonce}">console.log('Safe script');</script>`;
```

---

## 🗺️ Roadmap

- [ ] **Phase 3**: `j.json()` for secure JSON injection into scripts.
- [ ] **Phase 3**: Smart Whitespace Minifier for production builds.
- [ ] **Phase 4**: `jaga/sanitize` – An opt-in, ultra-lightweight HTML sanitizer (Allowlist-based).

## 📜 License

MIT © [Dogukan Batal](https://github.com/dogukanbatal)
