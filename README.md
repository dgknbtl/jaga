# 🛡️ Jaga

[![npm version](https://img.shields.io/npm/v/jagajs.svg?style=flat-square)](https://www.npmjs.com/package/jagajs)
[![bundle size](https://img.shields.io/bundlephobia/minzip/jagajs?label=size&style=flat-square)](https://bundlephobia.com/result?p=jagajs)
[![license](https://img.shields.io/npm/l/jagajs.svg?style=flat-square)](https://github.com/dgknbtl/jaga/blob/main/LICENSE)
[![typed](https://img.shields.io/badge/types-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)

**Jaga** is an ultra-lightweight, zero-dependency security layer for HTML templates, providing context-aware XSS protection between user input and the DOM.

Read the [Jaga Manifesto](MANIFESTO.md)

---

## Features

- **Smart Context Awareness**: Automatically identifies if data is in a `<div>`, an `href`, an `onclick`, or a `style` attribute.
- **HTML Sanitizer**: SSR-native allowlist sanitizer (`jagajs/sanitize`) — zero dependencies, works in Node.js, Bun, Deno.
- **CSS Context Protection**: Prevents CSS Injection in `style` attributes via lexical analysis and strict escaping.
- **Built-in URL Sanitization**: Proactively blocks `javascript:` and other dangerous protocols.
- **Native Trusted Types Support**: Automatically integrates with the browser's Trusted Types API for ultra-secure DOM assignment.
- **Secure JSON Injection**: `j.json(data)` safely embeds state into `<script>` tags, preventing breakout attacks.
- **Smart Minifier**: Automatically cleans up unnecessary whitespace between HTML tags (intelligently preserves `<pre>` and `<textarea>`).
- **DX Guardrails**: Helpful console warnings during development when a security risk or non-CSP-compliant pattern is detected.
- **Nano-sized**: Less than **3KB** gzipped (Core + Sanitizer). No dependencies, no bloat.

---

## Why Jaga?

Modern frameworks escape most things by default — but they rely on developers to handle the dangerous edges: raw HTML, dynamic attributes, and inline styles.

**Jaga** is built to secure those edges.

| Environment       | Secure Context | **Blind Spot (XSS Risk)**   | Jaga's Solution                    |
| ----------------- | -------------- | --------------------------- | ---------------------------------- |
| **SSR / Node.js** | -              | Unescaped string templates  | `j` template tag ✅ Native         |
| **React**         | JSX `{}`       | `dangerouslySetInnerHTML`   | `sanitize(html).toString()`        |
| **Vue**           | `{{ }}`        | `v-html`                    | `sanitize(html).toString()`        |
| **Angular**       | `{{ }}`        | `bypassSecurityTrustHtml()` | `sanitize(html).toString()`        |
| **Vanilla JS**    | -              | `element.innerHTML`         | `j` tag or `sanitize().toString()` |
| **Strict CSP**    | Trusted Types  | `TrustedHTML` Requirement   | `j` or `sanitize` (Native TT)      |

> **Note:** `sanitize()` returns a `JagaHTML` object (not a raw string). This is intentional — it prevents double-escaping when used with Jaga's `j` tag. When passing to React, Vue, or Angular APIs that expect a plain string, call `.toString()` explicitly. Jaga is most powerful in **SSR and Vanilla JS** environments, where it can act as a native security layer without framework abstractions.

### Comparison Table

| Feature                      | **Jaga** 🛡️                           | DOMPurify                      | isomorphic-dompurify           | Sanitize-html                  |
| ---------------------------- | ------------------------------------- | ------------------------------ | ------------------------------ | ------------------------------ |
| **Size (Gzipped)**           | **~2.5KB (core + sanitizer)**         | ~8.3KB                         | ~8.5KB                         | ~85.4KB                        |
| **Dependencies**             | **0 (Zero)**                          | 1                              | 2 (Direct)                     | 6 (Direct)                     |
| **Supply Chain Risk**        | **Minimal (0 deps)**                  | Low (mature, audited)          | Moderate (JSDOM dep)           | Moderate–High (tree)           |
| **Escaping Strategy**        | **Context-aware (attr/HTML/CSS/URL)** | Sanitization (post-processing) | Sanitization (post-processing) | Sanitization (post-processing) |
| **CSS Injection Protection** | **Yes (lexical sanitizer)**           | Limited                        | Limited                        | No                             |
| **SSR Support**              | **Native (no DOM required)**          | Requires DOM (JSDOM in SSR)    | Native (Built-in)              | Native                         |
| **Trusted Types**            | **Native integration**                | Supported                      | Supported                      | No                             |
| **Context-Aware Tag**        | **Yes (`j` tag)**                     | No                             | No                             | No                             |
| **Primary Use Case**         | Context-aware template security       | HTML sanitizer (industry std)  | Universal sanitizer            | Server-side sanitizer          |

> **Note:** Jaga focuses on prevention (compile-time / template-time), while others focus on sanitization (post-processing).

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

## Interactive Showcase

Explore **Jaga's** security features in action! The showcase demonstrates all the features of Jaga. To run the showcase locally:

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

**Jaga** handles arrays seamlessly and securely:

```javascript
const items = ["Safe", "<b>Bold</b>", "<i>Italic</i>"];
const list = j`<ul>${items.map((i) => j`<li>${i}</li>`)}</ul>`;
```

### 4. Smart Minifier

**Jaga's** `j` tag automatically minifies your HTML by removing unnecessary whitespace, but it's smart enough to ignore `<pre>` and `<textarea>` tags.

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

### 6. Lexical CSS Protection

**Jaga** features a production-grade **minimalist lexical CSS sanitizer**.
Unlike regex-based escapers, it uses a character-level state machine and a typed AST to enforce strict safety guarantees:

- **Strict Allowlists**: Only explicitly allowed properties (e.g. `color`, `font-size`) are permitted.
- **Modern CSS Support**: Includes logical properties like `margin-inline-start`, `padding-block-end`, etc.
- **Protocol Sanitization**: `url()` values are restricted to safe protocols (e.g. `https:`, `data:image/`).
- **Boundary Enforcement**: Prevents injection by disallowing property breakouts or new declarations.

```javascript
const maliciousStyle = 'color: red; background: url("javascript:alert(1)");';
const html = j`<div style="${maliciousStyle}">Safe Content</div>`;

// Result: <div style="color:red;">
```

---

## Trusted Types Compatible

**Jaga's** `JagaHTML` wrapper is designed to integrate natively with the browser's [Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API). When your CSP enforces `require-trusted-types-for 'script'`, **Jaga** automatically creates a policy and returns a `TrustedHTML` object through the `.toTrusted()` method (or automatically when using **Jaga's** output where a string is expected but Trusted Types are required).

```javascript
// Jaga handles the policy creation and wrapping for you:
const html = j`<div>${userInput}</div>`;

// Assign directly to innerHTML (Compatible with Trusted Types CSP)
element.innerHTML = html.toTrusted();
```

> Native `TrustedTypePolicy` integration is active and managed by Jaga's centralized policy controller. Support is isomorphic; it falls back to secure strings in non-supporting environments or SSR.

---

## Framework Integration (Handling Unsafe HTML)

Frameworks handle most cases safely by default. **Jaga** is designed for the edge cases they leave to developers.

In framework environments, **Jaga** is typically used via `sanitize(...).toString()` before passing the result into framework-specific APIs.

---

### React / Next.js (App Router)

**Jaga** is useful in React when you need to safely render user-controlled HTML, especially when using `dangerouslySetInnerHTML`.

Works especially well in Server Components, where Jaga runs entirely on the server with zero client overhead.

```javascript
// app/page.js (Server Component)
import { sanitize } from "jagajs/sanitize";

export default function Page({ searchParams }) {
  const clean = sanitize(searchParams.bio).toString();
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

---

### Vue 3 / Nuxt 3

Use **Jaga** to safely handle user HTML before binding it with `v-html`.

```html
<!-- components/UserBio.vue -->
<script setup>
  import { sanitize } from "jagajs/sanitize";

  const props = defineProps(["bio"]);
  const cleanHTML = computed(() => sanitize(props.bio).toString());
</script>

<template>
  <div v-html="cleanHTML"></div>
</template>
```

---

### Angular

Angular requires explicit trust for HTML rendering.
**Jaga** ensures the content is sanitized before being marked as safe.

```typescript
import { DomSanitizer } from '@angular/platform-browser';
import { sanitize } from 'jagajs/sanitize';

@Component({ ... })
export class MyComponent {
  constructor(private ds: DomSanitizer) {}

  getSafeHTML(html: string) {
    const clean = sanitize(html).toString();
    // Jaga sanitizes the content before explicitly trusting it
    return this.ds.bypassSecurityTrustHtml(clean);
  }
}
```

---

### Vanilla JavaScript

**Jaga** works natively in vanilla environments without any framework:

```javascript
import { j } from "jagajs";

const userInput = "<img src=x onerror=alert(1)>";

document.body.innerHTML = j`<div>${userInput}</div>`.toTrusted();
```

---

## Environment & Performance

### Support Matrix

**Jaga** runs natively across server and browser environments without requiring a DOM implementation.

| Environment  | Version    | Status                                   |
| ------------ | ---------- | ---------------------------------------- |
| **Node.js**  | v18+       | ✅ Native (SSR)                          |
| **Bun**      | v1.0+      | ✅ Native (SSR)                          |
| **Deno**     | v1.3+      | ✅ Native (SSR)                          |
| **Browsers** | All Modern | ✅ Native (Trusted Types in Chrome/Edge) |

### Performance Note

**Jaga** avoids DOM-based parsing and instead uses lightweight string processing and a minimal state machine, resulting in low runtime overhead. The CSS engine is **Stress-Tested** to handle 100+ levels of nesting in <1ms, ensuring your CPU remains cool even under malicious delivery.

---

## License

MIT © [Dogukan Batal](https://github.com/dgknbtl)
