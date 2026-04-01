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

const URL_ATTRS = new Set(['href', 'src', 'action', 'formaction', 'data']);

/**
 * Determines the HTML injection context for substitution at `index`.
 *
 * Builds a static prefix from strings[0..index] with \x00 placeholders
 * standing in for prior substitutions. This preserves tag/attribute structure
 * without letting dynamic content (quotes, angle brackets) corrupt detection.
 *
 * Handles:
 * - Multi-part attributes: href="${base}${path}" — both get url context
 * - Closed tags: <div class="x">${text} — text gets text context
 * - Closing tags: </div onclick="${x}"> — x gets text context
 * - Sequential attributes: data-a="${a}" class="${b}" — each resolved independently
 */
function resolveContext(strings: TemplateStringsArray, index: number): { context: 'text' | 'attr' | 'url' | 'css'; attrName: string } {
  let prefix = '';
  for (let i = 0; i <= index; i++) {
    if (i > 0) prefix += '\x00';
    prefix += strings[i];
  }

  const lastGt = prefix.lastIndexOf('>');
  const lastLt = prefix.lastIndexOf('<');

  // Text context: no open tag, or last < is before last >
  if (lastLt === -1 || lastLt < lastGt) return { context: 'text', attrName: '' };

  // Closing tags and comments are text context
  const afterLt = prefix[lastLt + 1];
  if (afterLt === '/' || afterLt === '!') return { context: 'text', attrName: '' };

  // Inside an open tag — find which attribute value we're currently in
  const tagContent = prefix.slice(lastLt);

  // Double-quoted attribute whose closing " hasn't appeared yet
  const dq = tagContent.match(/([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*"[^"]*$/);
  if (dq) {
    const name = dq[1].toLowerCase();
    if (name === 'style') return { context: 'css', attrName: name };
    if (URL_ATTRS.has(name)) return { context: 'url', attrName: name };
    return { context: 'attr', attrName: name };
  }

  // Single-quoted attribute whose closing ' hasn't appeared yet
  const sq = tagContent.match(/([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*'[^']*$/);
  if (sq) {
    const name = sq[1].toLowerCase();
    if (name === 'style') return { context: 'css', attrName: name };
    if (URL_ATTRS.has(name)) return { context: 'url', attrName: name };
    return { context: 'attr', attrName: name };
  }

  // Inside a tag but not in a quoted value (unquoted attr or attr name position)
  return { context: 'attr', attrName: '' };
}

export const j: JagaRenderer = function(strings: TemplateStringsArray, ...values: any[]): JagaHTML {
  let result = strings[0];

  for (let i = 0; i < values.length; i++) {
    const { context, attrName } = resolveContext(strings, i);

    // Strict CSP: Warn against inline event handlers (on*)
    if (attrName.startsWith('on')) {
      warn(`Strict CSP: Inline event handler "${attrName}" detected. Using addEventListener is strongly recommended for better security.`);
    }

    result += escapeHTML(values[i], context) + strings[i + 1];
  }

  // Smart Whitespace Minifier
  if (!/<pre|<textarea/i.test(result)) {
    result = result.replace(/>\s+</g, '><').trim();
  }

  // Native Trusted Types Integration
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

j.json = secureJSON;
j.css = (data: any) => new JagaHTML(escapeHTML(data, 'css'));
