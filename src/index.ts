// @ts-ignore
const JAGA_DEV = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

function warn(msg: string) {
  if (JAGA_DEV) {
    console.warn(`[Jaga Security] ${msg}`);
  }
}

export class JagaHTML {
  private value: string;

  constructor(value: string) {
    this.value = value;
  }

  toString(): string {
    return this.value;
  }

  /**
   * Support for Trusted Types API.
   */
  toJSON() {
    return this.value;
  }
}

/**
 * Escapes HTML special characters in a string.
 * Supports different contexts: 'text' (default) or 'attr'.
 */
export function escapeHTML(str: any, context: 'text' | 'attr' | 'url' = 'text'): string {
  if (str instanceof JagaHTML) return str.toString();
  if (Array.isArray(str)) return str.map(s => escapeHTML(s, context)).join('');
  
  const text = String(str);

  if (context === 'url') {
    // Block dangerous protocols: javascript:, data: (except safe images), vbscript:
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
 * Tagged template function for safe HTML generation.
 */
export function j(strings: TemplateStringsArray, ...values: any[]): JagaHTML {
  let result = strings[0];

  for (let i = 0; i < values.length; i++) {
    const prev = strings[i];
    let context: 'text' | 'attr' | 'url' = 'text';

    // Simple context detection: check if we are inside an attribute
    const attrMatch = prev.match(/([a-zA-Z-]+)\s*=\s*(?:['"]?)$/);
    if (attrMatch) {
      const attrName = attrMatch[1].toLowerCase();
      context = (attrName === 'href' || attrName === 'src') ? 'url' : 'attr';
    }

    result += escapeHTML(values[i], context) + strings[i + 1];
  }

  // Trusted Types Support
  // @ts-ignore
  if (typeof window !== 'undefined' && window.trustedTypes && window.trustedTypes.createPolicy) {
    // Note: In a real library, we'd probably want to cache the policy.
    // But for <1KB goals, we keep it simple.
    try {
      // @ts-ignore
      const policy = window.trustedTypes.createPolicy('jaga', {
        createHTML: (s: string) => s
      });
      return policy.createHTML(result) as unknown as JagaHTML;
    } catch (e) {
      // If policy already exists or fails, fallback to JagaHTML
    }
  }

  return new JagaHTML(result);
}

/**
 * Utility to mark a string as safe (DANGER: Use only for trusted content).
 */
export function unsafe(str: string): JagaHTML {
  return new JagaHTML(str);
}

/**
 * CSP Nonce generator.
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
