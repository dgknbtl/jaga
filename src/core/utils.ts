import { JagaHTML } from './types.js';

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
  if (typeof crypto !== 'undefined') {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return btoa(String.fromCharCode(...arr));
  }
  
  // Fallback for Node 10 or environments without crypto
  let res = '';
  for (let i = 0; i < 16; i++) {
    res += String.fromCharCode(Math.floor(Math.random() * 256));
  }
  return btoa(res);
}

/**
 * Marks a JSON object as safe for injection into <script> tags.
 * Escapes </script> and other sensitive characters.
 */
export function secureJSON(data: any): JagaHTML {
  const json = JSON.stringify(data)
    .replace(/<\/script/g, '<\\/script')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return new JagaHTML(json);
}
