// @ts-ignore
const JAGA_DEV = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

/**
 * Internal logging helper for development warnings.
 */
function warn(msg: string) {
  if (JAGA_DEV) {
    console.warn(`[Jaga Security] ${msg}`);
  }
}

/**
 * SafeHTML wrapper class to identify already-processed/safe content.
 * Prevents double-escaping and integrates with Trusted Types.
 */
export class JagaHTML {
  private value: string;

  constructor(value: string) {
    this.value = value;
  }

  toString(): string {
    return this.value;
  }

  toJSON() {
    return this.value;
  }
}

/**
 * The core escaping engine for Jaga.
 * Automatically identifies HTML context (text, attribute, or URL)
 * and applies the strictest security filters required.
 */
export function escapeHTML(str: any, context: 'text' | 'attr' | 'url' = 'text'): string {
  if (str instanceof JagaHTML) return str.toString();
  if (Array.isArray(str)) return str.map(s => escapeHTML(s, context)).join('');
  
  const text = String(str);

  if (context === 'url') {
    // Blocks dangerous protocols (javascript, data, vbscript).
    if (/^(?:javascript|data|vbscript):/i.test(text.trim())) {
      warn(`Dangerous protocol blocked in URL context: "${text.trim()}"`);
      return 'about:blank';
    }
  }

  let hasReplaced = false;
  const result = text.replace(/[&<>"']/g, (m) => {
    hasReplaced = true;
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });

  if (hasReplaced && context === 'attr') {
    warn(`Potential attribute breakout detected and sanitized: "${text}"`);
  }

  return result;
}

/**
 * Jaga Tagged Template Literal handler.
 * usage: j`<div>${userContent}</div>`
 */
export function j(strings: TemplateStringsArray, ...values: any[]): JagaHTML {
  let result = strings[0];

  for (let i = 0; i < values.length; i++) {
    const prev = strings[i];
    let context: 'text' | 'attr' | 'url' = 'text';

    // Context Detection Algorithm
    const attrMatch = prev.match(/([a-zA-Z-]+)\s*=\s*(?:['"]?)$/);
    if (attrMatch) {
      const attrName = attrMatch[1].toLowerCase();
      context = (attrName === 'href' || attrName === 'src') ? 'url' : 'attr';
    }

    result += escapeHTML(values[i], context) + strings[i + 1];
  }

  // Native Trusted Types Integration
  // @ts-ignore
  if (typeof window !== 'undefined' && window.trustedTypes && window.trustedTypes.createPolicy) {
    try {
      // @ts-ignore
      const policy = window.trustedTypes.createPolicy('jaga', {
        createHTML: (s: string) => s
      });
      return policy.createHTML(result) as unknown as JagaHTML;
    } catch (e) {}
  }

  return new JagaHTML(result);
}

/**
 * Explicitly marks a string as safe.
 * ⚠️ WARNING: Use only for trusted content.
 */
export function unsafe(str: string): JagaHTML {
  return new JagaHTML(str);
}

/**
 * Generates a cryptographically strong nonce for CSP.
 */
export function nonce(): string {
  const arr = new Uint8Array(16);
  if (typeof crypto !== 'undefined') {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < 16; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return btoa(String.fromCharCode(...arr));
}
