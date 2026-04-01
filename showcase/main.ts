import { j, nonce, version } from '../src/index';
import { sanitize } from '../src/sanitize';

interface Demo {
  id: string;
  badge: string;
  title: string;
  description: string;
  codeView: string;
  render: () => string;
}

document.addEventListener('DOMContentLoaded', () => {
  document.title = `Jaga Security Showcase v${version}`;
  const header = document.querySelector('header h1');
  if (header) header.textContent = `Jaga Showcase v${version}`;
  const footer = document.querySelector('footer');
  if (footer) footer.textContent = `Jaga Security v${version} | "Don't audit your security. Write it."`;

  // ── Demo data ──────────────────────────────────────────────────────────────

  const maliciousHTML = '<img src=x onerror=console.log("XSS-Blocked")> <b>Safe text</b> <script>alert(1)<\/script>';
  const state = {
    user: 'admin',
    bio: '<\/script><script>alert("JSON-Breakout-Attempt")<\/script>',
    meta: '"><img src=x onerror=alert(1)>',
  };
  const items = ['Safe Content', '<b>Bold Label</b>', 'javascript:alert("Protocol-Attack")'];
  const dangerousURL = "javascript:alert('pwned')";
  const maliciousStyle = 'red; background: url("javascript:alert(1)"); margin-inline-start: 2rem; color: \\6a avascript;';
  const sessionNonce = nonce();
  const dataHTML = '<div data-user-id="42" data-role="editor" data-FOO="blocked" data-="blocked" onclick="alert(1)">Framework-ready content</div>';

  // ── Demo definitions ───────────────────────────────────────────────────────

  const demos: Demo[] = [
    {
      id: 'ssr-demo',
      badge: 'SSR',
      title: 'Content Sanitization',
      description: 'Simulation of server-side sanitization for rich text content. Strips dangerous tags while preserving safety.',
      codeView: 'sanitize(maliciousHTML)',
      render: () => sanitize(maliciousHTML).toString(),
    },
    {
      id: 'client-demo',
      badge: 'Client',
      title: 'Trusted Types',
      description: 'Assignment to innerHTML using native Trusted Types policy. Prevents "sink" vulnerabilities.',
      codeView: 'element.innerHTML = j`...`.toTrusted()',
      render: () => j`<span><i>Native Trusted Types Applied Successfully</i></span>`.toString(),
    },
    {
      id: 'json-demo',
      badge: 'Security',
      title: 'Secure JSON Injection',
      description: 'Safely embedding complex state into script tags without breakout/termination risks.',
      codeView: 'j.json(complexState)',
      render: () => j`<code style="word-break:break-all; font-size:0.8rem;">${j.json(state).toString()}</code>`.toString(),
    },
    {
      id: 'list-demo',
      badge: 'Feature',
      title: 'List Rendering',
      description: 'Handling arrays and nested templates securely. Nested logic is automatically sanitized.',
      codeView: 'items.map(i =&gt; j`&lt;li&gt;${i}&lt;/li&gt;`)',
      render: () => `<ul>${j`${items.map(i => j`<li>Processed: ${i}</li>`)}`.toString()}</ul>`,
    },
    {
      id: 'url-demo',
      badge: 'Security',
      title: 'URL Protocol Guard',
      description: 'Automatic detection and blocking of <code>javascript:</code> schemas in <code>href</code> attributes.',
      codeView: '&lt;a href="${\'javascript: \'}"&gt;',
      render: () => j`<a href="${dangerousURL}" style="color:var(--primary); text-decoration:none; font-weight:600;">Blocked Link (Click → about:blank)</a>`.toString(),
    },
    {
      id: 'multipart-demo',
      badge: 'Security',
      title: 'Multi-Part Attribute Guard',
      description: 'Context detection persists across multi-part attributes. Every interpolation inside the same <code>href</code> gets URL sanitization — not just the first.',
      codeView: 'j`&lt;a href="${base}${attack}"&gt;` → about:blank',
      render: () => {
        const base = '';
        const attack = "javascript:alert('xss')";
        const result = j`<a href="${base}${attack}">link</a>`.toString();
        return j`
          <div style="font-size:0.8rem; font-family:monospace; margin-bottom:0.5rem; word-break:break-all;">
            2nd part: <span style="color:var(--warning);">${attack}</span>
          </div>
          <div style="font-size:0.8rem; font-family:monospace; word-break:break-all;">
            Output: <span style="color:var(--success);">${result.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
          </div>
        `.toString();
      },
    },
    {
      id: 'minify-demo',
      badge: 'DX',
      title: 'Smart Minifier',
      description: 'Strips whitespace between tags in template literals. When <code>&lt;pre&gt;</code> or <code>&lt;textarea&gt;</code> is detected, the entire template skips minification to preserve formatting.',
      codeView: 'j`  &lt;div&gt;  &lt;span&gt;x&lt;/span&gt;  &lt;/div&gt;  `',
      render: () => {
        const minified = j`
          <div>
            <span>compact</span>
          </div>
        `.toString();
        const withPre = j`
          <div>
            <pre>  spaces
  preserved  </pre>
          </div>
        `.toString();
        return j`
          <div style="font-size:0.8rem; font-family:monospace; margin-bottom:0.75rem; word-break:break-all;">
            <div style="color:var(--text-dim); margin-bottom:0.25rem;">Without &lt;pre&gt;:</div>
            <span style="color:var(--success);">${minified.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
          </div>
          <div style="font-size:0.8rem; font-family:monospace; word-break:break-all;">
            <div style="color:var(--text-dim); margin-bottom:0.25rem;">With &lt;pre&gt; (minification skipped):</div>
            <span style="color:var(--success);">${withPre.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
          </div>
        `.toString();
      },
    },
    {
      id: 'nonce-demo',
      badge: 'Security',
      title: 'CSP Nonce Helper',
      description: 'Cryptographically secure nonce generation for strict Content Security Policies.',
      codeView: "import { nonce } from 'jagajs'",
      render: () => j`
        <code>Generated Nonce:</code>
        <div style="margin-top:0.5rem; word-break:break-all; color:var(--success);">${sessionNonce}</div>
        <div style="margin-top:0.5rem; font-size:0.8rem; color:var(--text-dim);">Use this in your CSP Header and script tags.</div>
      `.toString(),
    },
    {
      id: 'css-demo',
      badge: 'SEC',
      title: 'Lexical CSS Protection',
      description: 'Advanced Lexical CSS Sanitizer. AST-based parsing, protocol filtering, and boundary enforcement.',
      codeView: 'j`&lt;div style="${\'color: red; ...\'}"&gt;`',
      render: () => j`
        <div style="font-size:0.8rem; color:var(--text-dim); font-family:monospace; margin-bottom:0.5rem; word-break:break-all;">
          Input: <span style="color:var(--warning);">${maliciousStyle}</span>
        </div>
        <div style="font-size:0.8rem; font-family:monospace;">
          Output: <span style="color:var(--success);">${j.css(maliciousStyle)}</span>
        </div>
      `.toString(),
    },
    {
      id: 'data-attr-demo',
      badge: 'Feature',
      title: 'data-* Attributes',
      description: '<code>data-*</code> attributes pass through sanitization safely, enabling Alpine.js, HTMX, and other data-attribute-driven frameworks.',
      codeView: 'sanitize(\'&lt;div data-id="42"&gt;\')',
      render: () => {
        const sanitized = sanitize(dataHTML).toString();
        return j`
          <div style="font-size:0.8rem; color:var(--text-dim); font-family:monospace; margin-bottom:0.5rem; word-break:break-all;">
            Input: <span style="color:var(--warning);">${dataHTML}</span>
          </div>
          <div style="font-size:0.8rem; font-family:monospace; word-break:break-all;">
            Output: <span style="color:var(--success);">${sanitized}</span>
          </div>
        `.toString();
      },
    },
  ];

  // ── Render cards ───────────────────────────────────────────────────────────

  const grid = document.querySelector('.grid')!;
  grid.innerHTML = demos.map(d => `
    <div class="card">
      <h2><span class="badge">${d.badge}</span> ${d.title}</h2>
      <p>${d.description}</p>
      <div class="code-view">${d.codeView}</div>
      <div id="${d.id}" class="demo-box"></div>
    </div>
  `).join('');

  // ── Run demos with error isolation ─────────────────────────────────────────

  for (const demo of demos) {
    const el = document.getElementById(demo.id)!;
    try {
      el.innerHTML = demo.render();
    } catch (e) {
      el.innerHTML = `<span style="color:var(--danger);font-size:0.8rem;">Error: ${e instanceof Error ? e.message : String(e)}</span>`;
    }
  }

  console.log(`%c 🛡️ Jaga Security Showcase v${version} `, 'background: #6366f1; color: #fff; font-size: 20px; padding: 10px; border-radius: 5px;');
  console.log('Session Nonce:', sessionNonce);
  console.log('Trusted Output Sample:', j`<b>Test</b>`.toTrusted());
});
