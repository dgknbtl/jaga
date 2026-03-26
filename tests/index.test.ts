import { describe, it, expect, vi } from 'vitest';
import { j, unsafe, nonce, JagaHTML } from '../src/index';

describe('Jaga Phase 1: Smart Context Awareness', () => {
  describe('Text Context', () => {
    it('should escape basic HTML characters in text', () => {
      expect(j`<div>${'<img src=x>'}</div>`.toString()).toBe('<div>&lt;img src=x&gt;</div>');
    });
  });

  describe('Attribute Context', () => {
    it('should escape quotes in attributes to prevent breakout', () => {
      const payload = 'x" onclick="alert(1)';
      const output = j`<div id="${payload}"></div>`;
      expect(output.toString()).toBe('<div id="x&quot; onclick=&quot;alert(1)"></div>');
    });

    it('should handle single quotes in attributes', () => {
      const payload = "x' onmouseover='alert(1)";
      const output = j`<div class='${payload}'></div>`;
      expect(output.toString()).toBe("<div class='x&#39; onmouseover=&#39;alert(1)'></div>");
    });
  });

  describe('URL Context', () => {
    it('should block javascript: protocols in href', () => {
      const malicious = "javascript:alert('XSS')";
      expect(j`<a href="${malicious}">Link</a>`.toString()).toBe('<a href="about:blank">Link</a>');
    });

    it('should block javascript: protocols in src', () => {
      const malicious = "javascript:alert(1)";
      expect(j`<img src="${malicious}">`.toString()).toBe('<img src="about:blank">');
    });

    it('should allow safe protocols in href', () => {
      const safe = "https://google.com";
      expect(j`<a href="${safe}">Link</a>`.toString()).toBe('<a href="https://google.com">Link</a>');
    });

    it('should handle case-insensitive protocol blocking', () => {
      const malicious = "javaSCRIPT:alert(1)";
      expect(j`<a href="${malicious}">Link</a>`.toString()).toBe('<a href="about:blank">Link</a>');
    });
  });

  describe('Mixed Contexts', () => {
    it('should handle multiple contexts in one template', () => {
      const id = 'my"id';
      const url = 'javascript:alert(1)';
      const text = '<b>Name</b>';
      const output = j`<div id="${id}"><a href="${url}">${text}</a></div>`;
      expect(output.toString()).toBe('<div id="my&quot;id"><a href="about:blank">&lt;b&gt;Name&lt;/b&gt;</a></div>');
    });
  });

  describe('Security Warnings (Dev Mode)', () => {
    it('should warn when a dangerous protocol is blocked', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      j`<a href="${'javascript:alert(1)'}"></a>`;
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('[Jaga Security] Dangerous protocol blocked'));
      spy.mockRestore();
    });

    it('should warn when an attribute breakout is detected', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      j`<div id="${'x" onclick="alert(1)'}"></div>`;
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('[Jaga Security] Potential attribute breakout detected'));
      spy.mockRestore();
    });
  });

  describe('Utilities', () => {
    it('should generate secure nonces', () => {
      const n1 = nonce();
      const n2 = nonce();
      expect(n1).not.toBe(n2);
      expect(n1.length).toBeGreaterThan(10);
    });

    it('should escape JSON for script tags using j.json', () => {
      const data = { xss: '</script><script>alert(1)</script>' };
      const escapedJson = j.json(data).toString();
      expect(escapedJson).toContain('<\\/script>');
      expect(escapedJson).not.toContain('</script>');
    });

    it('should minify whitespace between tags', () => {
      const html = j`
        <div>
          <span>Hello</span>
        </div>
      `;
      expect(html.toString()).toBe('<div><span>Hello</span></div>');
    });

    it('should not minify whitespace inside pre or textarea', () => {
      const html = j`<pre>  spaced  </pre>`;
      expect(html.toString()).toBe('<pre>  spaced  </pre>');
    });

    it('should warn for inline event handlers (Strict CSP)', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      j`<button onclick="${'alert(1)'}">Click</button>`;
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Strict CSP'));
      consoleSpy.mockRestore();
    });

    it('should support unsafe for bypass', () => {
      const trusted = 'javascript:trustMe()';
      expect(j`<a href="${unsafe(trusted)}"></a>`.toString()).toBe('<a href="javascript:trustMe()"></a>');
    });
  });

  describe('Library Instance', () => {
    it('should return a JagaHTML instance', () => {
      const output = j`test`;
      expect(output).toBeInstanceOf(JagaHTML);
    });
  });
});
