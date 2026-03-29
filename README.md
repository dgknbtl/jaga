# 🛡️ Jaga

[![npm version](https://img.shields.io/npm/v/jagajs.svg?style=flat-square)](https://www.npmjs.com/package/jagajs)
[![bundle size](https://img.shields.io/bundlephobia/minzip/jagajs?label=size&style=flat-square)](https://bundlephobia.com/result?p=jagajs)
[![license](https://img.shields.io/npm/l/jagajs.svg?style=flat-square)](https://github.com/dgknbtl/jaga/blob/main/LICENSE)
[![typed](https://img.shields.io/badge/types-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)

**Jaga** (named after the word for _"guard"_ or _"protect"_) is an ultra-lightweight, zero-dependency security engine that brings **Context-Aware XSS Protection** to your HTML templates. It's the invisible guardian between your user's data and your application's DOM.

> "Don't audit your security. Write it."

---

## Features

- **Smart Context Awareness**: Automatically identifies if data is in a `<div>`, an `href`, or an `onclick`.
- **Built-in URL Sanitization**: Proactively blocks `javascript:` and other dangerous protocols.
- **HTML Sanitizer**: SSR-native allowlist sanitizer (`jagajs/sanitize`) — zero dependencies, works in Node.js, Bun, Deno.
- **Native Trusted Types Support**: Automatically integrates with the browser's Trusted Types API for ultra-secure DOM assignment.
- **Secure JSON Injection**: `j.json(data)` safely embeds state into `<script>` tags, preventing breakout attacks.
- **Smart Minifier**: Automatically cleans up unnecessary whitespace between HTML tags (intelligently preserves `<pre>` and `<textarea>`).
- **DX Guardrails**: Helpful console warnings during development when a security risk or non-CSP-compliant pattern is detected.
- **Nano-sized**: Less than **3KB** gzipped (Core + Sanitizer). No dependencies, no bloat.
- **Modular & Extensible**: A clean, scalable project structure designed for growth and performance.

---

## Why Jaga?

Modern frameworks (React, Vue, Angular) are great at escaping data in their templates, but they have **blind spots** where they leave security entirely to the developer. Jaga is built to fill those gaps.

| Environment       | Secure Context | **Blind Spot (XSS Risk)**   | Jaga's Solution                    |
| ----------------- | -------------- | --------------------------- | ---------------------------------- |
| **SSR / Node.js** | -              | String Templates            | `j` template tag ✅ Native         |
| **React**         | JSX `{}`       | `dangerouslySetInnerHTML`   | `sanitize(html).toString()`        |
| **Vue**           | `{{ }}`        | `v-html`                    | `sanitize(html).toString()`        |
| **Angular**       | `{{ }}`        | `bypassSecurityTrustHtml()` | `sanitize(html).toString()`        |
| **Vanilla JS**    | -              | `element.innerHTML`         | `j` tag or `sanitize().toString()` |

> **Note:** `sanitize()` returns a `JagaHTML` object (not a raw string). This is intentional — it prevents double-escaping when used with Jaga's `j` tag. When passing to React, Vue, or Angular APIs that expect a plain string, call `.toString()` explicitly. Jaga is most powerful in **SSR and Vanilla JS** environments where it works natively without ceremony.

### Comparison Table

| Feature                | **Jaga** 🛡️         | DOMPurify          | Sanitize-html      |
| ---------------------- | ------------------- | ----------------- | ------------------ |
| **Size (Gzipped)**     | **< 3KB**           | ~7.2KB            | ~158KB             |
| **Dependencies**       | **0 (Zero)**        | 0                 | 60+ (Transitive)   |
| **SSR Support**        | **Native**          | Requires `jsdom`  | Native             |
| **Trusted Types**      | **Native Support**  | Supported         | No                 |
| **Context-Aware Tag**  | **Yes (`j` tag)** | No                | No                 |
| **Smart Minifier**     | **Yes**             | No                | No                 |
| **Primary Use Case**   | Security Engine     | Pure Sanitizer    | Server Sanitizer   |

---

## Getting Started

### Installation

```bash
npm install jagajs
```

### Basic Usage

Jaga uses **Context-Aware Escaping**. It knows where your data is going and applies the correct security rules automatically.

```javascript
import { j } from "jagajs";

const userUrl = "javascript:alert(1)";
const userName = '"><img src=x onerror=alert(1)>';

// Jaga handles everything:
const html = j`
  <div title="${userName}">
    <a href="${userUrl}">Profile</a>
  </div>
`;

// Result:
// <div title="&quot;&gt;&lt;img src=x onerror=alert(1)&gt;">
//   <a href="about:blank">Profile</a>
// </div>
```

---

## 🎨 Interactive Showcase

Explore Jaga's security features in action! The showcase demonstrates all the features of Jaga. To run the showcase locally:

```bash
npm install
npm run showcase
```

---

## Advanced Features

### 1. HTML Sanitizer (SSR-Ready)

Use this for `dangerouslySetInnerHTML` or whenever you need to permit _some_ HTML (like from a rich text editor) but block the dangerous parts.

```javascript
import { sanitize } from "jagajs/sanitize";

// Strip dangerous tags/attrs but keep formatting
const clean = sanitize(userRichText, {
  allowedTags: ["b", "i", "p", "a"],
  allowedAttrs: { a: ["href"] },
});

// Works perfectly with Jaga core
const article = j`<div class="content">${clean}</div>`;
```

### 2. Secure JSON Injection

Safely inject server-side state into your frontend without worrying about `</script>` breakouts.

```javascript
const state = {
  user: "Admin",
  bio: "</script><script>alert('pwned')</script>",
};

const html = j`
  <script>
    window.__INITIAL_STATE__ = ${j.json(state)};
  </script>
`;
```

### 3. List Rendering

Jaga handles arrays seamlessly and securely:

```javascript
const items = ["Safe", "<b>Bold</b>", "<i>Italic</i>"];
const list = j`<ul>${items.map((i) => j`<li>${i}</li>`)}</ul>`;
```

### 4. Smart Minifier

Jaga's `j` tag automatically minifies your HTML by removing unnecessary whitespace, but it's smart enough to ignore `<pre>` and `<textarea>` tags.

```javascript
const html = j`
  <div>
    <span>Compact but...</span>
    <pre>  This space is preserved!  </pre>
  </div>
`;
```

### 5. Secure Nonce for CSP

Easy injection of CSP nonces for inline scripts:

```javascript
import { j, nonce } from "jagajs";

const myNonce = nonce();
const script = j`<script nonce="${myNonce}">console.log('Safe script');</script>`;
```

---

## Trusted Types Compatible

Jaga's `JagaHTML` wrapper is designed to integrate natively with the browser's [Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API). When your CSP enforces `require-trusted-types-for 'script'`, Jaga automatically creates a policy and returns a `TrustedHTML` object through the `.toTrusted()` method (or automatically when using Jaga's output where a string is expected but Trusted Types are required).

```javascript
// Jaga handles the policy creation and wrapping for you:
const html = j`<div>${userInput}</div>`;

// Assign directly to innerHTML (Compatible with Trusted Types CSP)
element.innerHTML = html.toTrusted();
```

> Native `TrustedTypePolicy` integration is active and managed by Jaga's centralized policy controller. Support is isomorphic; it falls back to secure strings in non-supporting environments or SSR.

---

## License

MIT © [Dogukan Batal](https://github.com/dgknbtl)
