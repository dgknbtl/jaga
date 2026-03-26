# 🛡️ Jaga

**The Zero-Dependency, Security-First Tagged Template Engine.**

Jaga (meaning "to guard" or "protect") is an ultra-lightweight (<1KB), build-step-optional tagged template engine designed to prevent XSS (Cross-Site Scripting) by default when generating HTML in the browser.

## 🚀 Highlights

- 🧠 **Smart Context Awareness**: Automatically detects if a variable is in an attribute or text.
- 🛡️ **URL Sanitization**: Blocks `javascript:` protocols in `href`/`src` by default.
- ⚠️ **Dev-Mode Warnings**: Proactive console alerts for security risks (Zero-bloat in Production).
- 🪶 **Ultra-Lightweight**: < 1KB (Gzipped: ~900 bytes).
- 🌍 **Trusted Types**: Built-in support for Trusted Types API.
- 🔐 **CSP Ready**: Includes a `nonce()` helper for secure inline scripts.
- 🧬 **Zero-Dependency**: No external dependencies.

## 📦 Installation

```bash
npm install jaga
```

## 🛠️ Usage

### Smart Context & Safety

Jaga knows where your data goes. It automatically handles attribute breakouts and dangerous protocols.

```javascript
import { j } from 'jaga';

// Dangerous protocols are blocked in href/src
const link = j`<a href="${"javascript:alert(1)"}">Click</a>`; 
// Result: <a href="about:blank">Click</a>

// Attribute breakouts are prevented
const div = j`<div id="${'prop" onclick="alert(1)'}"></div>`;
// Result: <div id="prop&quot; onclick=&quot;alert(1)&quot;"></div>
```

### CSP Nonce Support

```javascript
import { j, nonce } from 'jaga';

const myNonce = nonce();
const script = j`<script nonce="${myNonce}">...</script>`;
```

### Lists and Loops

```javascript
const items = ['Apple', 'Banana', 'Cherry'];

const list = j`
  <ul>
    ${items.map(item => j`<li>${item}</li>`)}
  </ul>
`;
```

## 📜 License

MIT
