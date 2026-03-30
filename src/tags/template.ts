import { JagaHTML } from '../core/types.js';
import { escapeHTML, warn } from '../core/escape.js';
import { getJagaPolicy } from '../core/policy.js';
import { secureJSON } from '../core/utils.js';

/**
 * Jaga Tagged Template Literal handler.
 * usage: j`<div>${userContent}</div>`
 */
export interface JagaRenderer {
  (strings: TemplateStringsArray, ...values: any[]): JagaHTML;
  json(data: any): JagaHTML;
  css(data: any): JagaHTML;
}

export const j: JagaRenderer = function(strings: TemplateStringsArray, ...values: any[]): JagaHTML {
  let result = strings[0];

  for (let i = 0; i < values.length; i++) {
    const prev = strings[i];
    let context: 'text' | 'attr' | 'url' | 'css' = 'text';

    // Context Detection Algorithm
    const attrMatch = prev.match(/([a-zA-Z-]+)\s*=\s*['"]?[^>]*$/);
    if (attrMatch) {
      const attrName = attrMatch[1].toLowerCase();
      if (attrName === 'style') {
        context = 'css';
      } else {
        context = (attrName === 'href' || attrName === 'src') ? 'url' : 'attr';
      }

      // Strict CSP: Warn against inline event handlers (on*)
      if (attrName.startsWith('on')) {
        warn(`Strict CSP: Inline event handler "${attrName}" detected. Using addEventListener is strongly recommended for better security.`);
      }
    }

    result += escapeHTML(values[i], context) + strings[i + 1];
  }

  // Smart Whitespace Minifier (Simple version)
  // Note: This won't run if <pre> or <textarea> is detected to avoid breaking them.
  if (!/<pre|<textarea/i.test(result)) {
    result = result.replace(/>\s+</g, '><').trim();
  }

  // Native Trusted Types Entegrasyonu
  const policy = getJagaPolicy();
  if (policy) {
    try {
      const trusted = policy.createHTML(result);
      return new JagaHTML(result, trusted);
    } catch (e) {
      // Fallback
    }
  }

  return new JagaHTML(result);
} as JagaRenderer;

// Attach helpers
j.json = secureJSON;
j.css = (data: any) => new JagaHTML(escapeHTML(data, 'css'));
