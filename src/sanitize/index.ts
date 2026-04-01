import { JagaHTML } from '../core/types.js';
import { getJagaPolicy } from '../core/policy.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttrs?: Record<string, string[]>;
}

type ParserState =
  | 'TEXT'
  | 'TAG_OPEN'
  | 'CLOSING_TAG'
  | 'TAG_NAME'
  | 'ATTRS'
  | 'ATTR_NAME'
  | 'ATTR_EQ'
  | 'ATTR_VAL_D'
  | 'ATTR_VAL_S'
  | 'ATTR_VAL_U'
  | 'COMMENT'
  | 'RAWTEXT';

// ─── Defaults ─────────────────────────────────────────────────────────────────

const RAWTEXT_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'base']);
const SAFE_PROTOCOLS = /^(https?|mailto|tel|ftp):/i;
const URL_ATTRS = new Set(['href', 'src', 'action', 'data', 'formaction']);

const DEFAULT_TAGS = [
  'b', 'i', 'em', 'strong', 'u', 's', 'del', 'ins',
  'p', 'br', 'hr', 'span', 'div', 'blockquote', 'pre', 'code',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const DEFAULT_ATTRS: Record<string, string[]> = {
  '*':   ['class', 'id', 'title', 'aria-label', 'aria-hidden', 'role', 'tabindex'],
  'a':   ['href', 'target', 'rel'],
  'img': ['src', 'alt', 'width', 'height', 'loading'],
  'td':  ['colspan', 'rowspan'],
  'th':  ['colspan', 'rowspan', 'scope'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeUrl(value: string): string {
  const trimmed = value.trim();
  const decoded = trimmed
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
  
  if (/^(?:javascript|data|vbscript):/i.test(decoded.replace(/\s/g, ''))) {
    return 'about:blank';
  }
  
  if (!SAFE_PROTOCOLS.test(decoded) && !decoded.startsWith('/') && !decoded.startsWith('#') && !decoded.startsWith('.')) {
    return 'about:blank';
  }
  
  return decoded.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function escapeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildAttrs(
  tagName: string,
  rawAttrs: Record<string, string>,
  mergedAttrs: Record<string, string[]>
): string {
  const global = mergedAttrs['*'] ?? [];
  const specific = mergedAttrs[tagName] ?? [];
  const allowed = new Set([...global, ...specific]);

  let out = '';
  for (const [name, value] of Object.entries(rawAttrs)) {
    if (!allowed.has(name)) continue;
    const safe = URL_ATTRS.has(name) ? safeUrl(value) : value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    out += ` ${name}="${safe}"`;
  }
  return out;
}

// ─── Core State Machine ───────────────────────────────────────────────────────

function parse(
  html: string,
  allowedTags: Set<string>,
  mergedAttrs: Record<string, string[]>
): string {
  const parts: string[] = [];
  let state: ParserState = 'TEXT';
  let tagName = '';
  let isClosing = false;
  let attrName = '';
  let attrValue = '';
  let attrs: Record<string, string> = {};
  let textBuf = '';
  let rawDepth = 0;
  let rawTag = '';

  const flush = () => {
    if (textBuf) { parts.push(escapeText(textBuf)); textBuf = ''; }
  };

  const emitTag = () => {
    const name = tagName.toLowerCase();
    if (isClosing) {
      if (allowedTags.has(name)) parts.push(`</${name}>`);
      return;
    }
    if (!allowedTags.has(name)) return;
    const attrStr = buildAttrs(name, attrs, mergedAttrs);
    parts.push(`<${name}${attrStr}>`);
  };

  for (let i = 0; i < html.length; i++) {
    const ch = html[i];
    switch (state) {
      case 'TEXT':
        if (ch === '<') { flush(); state = 'TAG_OPEN'; }
        else textBuf += ch;
        break;
      case 'TAG_OPEN':
        if (ch === '/') { isClosing = true; tagName = ''; state = 'CLOSING_TAG'; }
        else if (ch === '!') {
          if (html.slice(i, i + 3) === '!--') { state = 'COMMENT'; i += 2; }
          else { state = 'TEXT'; }
        }
        else if (/[a-zA-Z]/.test(ch)) {
          isClosing = false; tagName = ch; attrs = {}; attrName = ''; attrValue = '';
          state = 'TAG_NAME';
        }
        else { textBuf += '<' + ch; state = 'TEXT'; }
        break;
      case 'CLOSING_TAG':
        if (ch === '>') {
          const name = tagName.toLowerCase();
          if (RAWTEXT_TAGS.has(name) && rawTag === name) {
            rawDepth--; if (rawDepth === 0) { state = 'TEXT'; rawTag = ''; }
          } else {
            if (allowedTags.has(name)) parts.push(`</${name}>`);
            state = 'TEXT';
          }
          tagName = '';
        }
        else if (/[\s]/.test(ch)) { /* ignore */ }
        else tagName += ch;
        break;
      case 'TAG_NAME':
        if (ch === '>') {
          const name = tagName.toLowerCase();
          if (RAWTEXT_TAGS.has(name)) { rawDepth++; rawTag = name; state = 'RAWTEXT'; }
          else { emitTag(); state = 'TEXT'; }
          tagName = ''; attrs = {};
        }
        else if (/\s/.test(ch)) state = 'ATTRS';
        else tagName += ch;
        break;
      case 'ATTRS':
        if (ch === '>') {
          const name = tagName.toLowerCase();
          if (RAWTEXT_TAGS.has(name)) { rawDepth++; rawTag = name; state = 'RAWTEXT'; }
          else { emitTag(); state = 'TEXT'; }
          tagName = ''; attrs = {};
        }
        else if (ch === '/') { /* ignore */ }
        else if (!/\s/.test(ch)) { attrName = ch; state = 'ATTR_NAME'; }
        break;
      case 'ATTR_NAME':
        if (ch === '=') state = 'ATTR_EQ';
        else if (ch === '>') {
          if (attrName) attrs[attrName.toLowerCase()] = '';
          const name = tagName.toLowerCase();
          if (RAWTEXT_TAGS.has(name)) { rawDepth++; rawTag = name; state = 'RAWTEXT'; }
          else { emitTag(); state = 'TEXT'; }
          tagName = ''; attrs = {};
        }
        else if (/\s/.test(ch)) { if (attrName) attrs[attrName.toLowerCase()] = ''; attrName = ''; state = 'ATTRS'; }
        else attrName += ch;
        break;
      case 'ATTR_EQ':
        if (ch === '"') { attrValue = ''; state = 'ATTR_VAL_D'; }
        else if (ch === "'") { attrValue = ''; state = 'ATTR_VAL_S'; }
        else if (!/\s/.test(ch)) { attrValue = ch; state = 'ATTR_VAL_U'; }
        break;
      case 'ATTR_VAL_D':
        if (ch === '"') { attrs[attrName.toLowerCase()] = attrValue; attrName = ''; attrValue = ''; state = 'ATTRS'; }
        else attrValue += ch;
        break;
      case 'ATTR_VAL_S':
        if (ch === "'") { attrs[attrName.toLowerCase()] = attrValue; attrName = ''; attrValue = ''; state = 'ATTRS'; }
        else attrValue += ch;
        break;
      case 'ATTR_VAL_U':
        if (/[\s>]/.test(ch)) {
          attrs[attrName.toLowerCase()] = attrValue; attrName = ''; attrValue = '';
          if (ch === '>') {
            const name = tagName.toLowerCase();
            if (RAWTEXT_TAGS.has(name)) { rawDepth++; rawTag = name; state = 'RAWTEXT'; }
            else { emitTag(); state = 'TEXT'; }
            tagName = ''; attrs = {};
          } else state = 'ATTRS';
        }
        else attrValue += ch;
        break;
      case 'COMMENT':
        if (ch === '-' && html.slice(i, i + 3) === '-->') { i += 2; state = 'TEXT'; }
        break;
      case 'RAWTEXT':
        if (ch === '<' && html.slice(i + 1, i + 2) === '/') {
          const rest = html.slice(i + 2);
          const closeMatch = rest.match(/^([a-zA-Z]+)[\s>]/);
          if (closeMatch && closeMatch[1].toLowerCase() === rawTag) {
            const endIdx = html.indexOf('>', i + 2);
            if (endIdx !== -1) { rawDepth--; if (rawDepth === 0) { state = 'TEXT'; rawTag = ''; } i = endIdx; }
          }
        }
        break;
    }
  }

  if (textBuf) parts.push(escapeText(textBuf));
  return parts.join('');
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function sanitize(html: string, options: SanitizeOptions = {}): JagaHTML {
  const allowedTags = new Set((options.allowedTags ?? DEFAULT_TAGS).map((t) => t.toLowerCase()));
  const mergedAttrs: Record<string, string[]> = { ...DEFAULT_ATTRS };
  if (options.allowedAttrs) {
    for (const [tag, attrList] of Object.entries(options.allowedAttrs)) {
      mergedAttrs[tag] = [...(mergedAttrs[tag] ?? []), ...attrList];
    }
  }

  const result = parse(html, allowedTags, mergedAttrs);

  // Trusted Types Integration
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
}
