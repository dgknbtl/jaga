import { describe, it, expect } from 'vitest';
import { sanitize } from '../src/sanitize';

describe('Jaga Sanitizer — jagajs/sanitize', () => {

  describe('XSS Protection', () => {
    it('should strip <script> tags entirely', () => {
      expect(sanitize('<script>alert(1)</script>').toString()).toBe('');
    });

    it('should strip <script> tag content too', () => {
      expect(sanitize('<p>Safe</p><script>alert(1)</script>').toString()).toBe('<p>Safe</p>');
    });

    it('should strip <style> tags and content', () => {
      expect(sanitize('<style>body{color:red}</style><b>text</b>').toString()).toBe('<b>text</b>');
    });

    it('should strip <iframe> tags', () => {
      expect(sanitize('<iframe src="evil.com"></iframe>').toString()).toBe('');
    });

    it('should remove onerror inline handlers', () => {
      const result = sanitize('<img src="x" onerror="alert(1)">').toString();
      expect(result).not.toContain('onerror');
      expect(result).toContain('<img');
    });

    it('should remove onclick and other event attributes', () => {
      const result = sanitize('<a href="/" onclick="alert(1)">link</a>').toString();
      expect(result).not.toContain('onclick');
    });
  });

  describe('URL Safety', () => {
    it('should block javascript: protocol in href', () => {
      const result = sanitize('<a href="javascript:alert(1)">click</a>').toString();
      expect(result).toContain('about:blank');
      expect(result).not.toContain('javascript:');
    });

    it('should block data: protocol in href', () => {
      const result = sanitize('<a href="data:text/html,<h1>xss</h1>">click</a>').toString();
      expect(result).toContain('about:blank');
    });

    it('should allow safe https:// links', () => {
      const result = sanitize('<a href="https://example.com">link</a>').toString();
      expect(result).toContain('href="https://example.com"');
    });

    it('should allow relative links', () => {
      const result = sanitize('<a href="/about">About</a>').toString();
      expect(result).toContain('href="/about"');
    });
  });

  describe('Allowlist Enforcement', () => {
    it('should keep allowlisted tags', () => {
      const result = sanitize('<b>bold</b> and <i>italic</i>').toString();
      expect(result).toBe('<b>bold</b> and <i>italic</i>');
    });

    it('should strip non-allowlisted tags but keep text', () => {
      const result = sanitize('<marquee>spinning</marquee>').toString();
      expect(result).toBe('spinning');
      expect(result).not.toContain('marquee');
    });

    it('should handle nested allowlisted tags', () => {
      const result = sanitize('<p><b>bold <i>italic</i></b></p>').toString();
      expect(result).toBe('<p><b>bold <i>italic</i></b></p>');
    });

    it('should support custom allowedTags', () => {
      const result = sanitize('<p>para</p><b>bold</b>', {
        allowedTags: ['p'],
      }).toString();
      expect(result).toContain('<p>');
      expect(result).not.toContain('<b>');
      expect(result).toContain('bold'); // text preserved
    });

    it('should support custom allowedAttrs', () => {
      const result = sanitize('<span data-id="123">text</span>', {
        allowedTags: ['span'],
        allowedAttrs: { 'span': ['data-id'] },
      }).toString();
      expect(result).toContain('data-id="123"');
    });
  });

  describe('Text Escaping', () => {
    it('should escape HTML entities in text nodes', () => {
      const result = sanitize('1 < 2 & 3 > 0').toString();
      expect(result).toBe('1 &lt; 2 &amp; 3 &gt; 0');
    });
  });

  describe('HTML Comments', () => {
    it('should strip HTML comments', () => {
      const result = sanitize('<!-- comment --><b>text</b>').toString();
      expect(result).toBe('<b>text</b>');
      expect(result).not.toContain('comment');
    });
  });

  describe('Returns JagaHTML', () => {
    it('sanitize output should be usable as JagaHTML (pass-through in j``)', () => {
      const result = sanitize('<b>safe</b>');
      expect(result.toString()).toBe('<b>safe</b>');
    });
  });
});
