import { JagaHTML } from './types.js';

// @ts-ignore
const JAGA_DEV = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

/**
 * Internal logging helper for development warnings.
 */
export function warn(msg: string) {
  if (JAGA_DEV) {
    console.warn(`[Jaga Security] ${msg}`);
  }
}

/**
 * The core escaping engine for Jaga.
 * Automatically identifies HTML context (text, attribute, or URL)
 * and applies the strictest security filters required.
 */
export function escapeHTML(str: any, context: 'text' | 'attr' | 'url' | 'css' = 'text'): string {
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

  if (context === 'css') {
    // CSS Escaping: Escape non-alphanumeric characters as \HH 
    return text.replace(/[^a-z0-9]/gi, (c) => {
      const hex = c.charCodeAt(0).toString(16);
      return `\\${hex.padStart(2, '0')} `;
    });
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
