import { j, nonce, version } from '../src/index';
import { sanitize } from '../src/sanitize';

document.addEventListener('DOMContentLoaded', () => {
  console.log(`%c 🛡️ Jaga Security Showcase v${version} `, 'background: #6366f1; color: #fff; font-size: 20px; padding: 10px; border-radius: 5px;');

  // Update DOM version placeholders
  document.title = `🛡️ Jaga Security Showcase v${version}`;
  const header = document.querySelector('header h1');
  if (header) header.textContent = `Jaga Showcase v${version}`;
  const footer = document.querySelector('footer');
  if (footer) footer.innerHTML = `Jaga Security v${version} | "Don't audit your security. Write it."`;

  // 1. SSR Sanitization
  const ssrDemo = document.getElementById('ssr-demo')!;
  const maliciousHTML = '<img src=x onerror=console.log("XSS-Blocked")> <b>Safe text</b> <script>alert(1)</script>';
  ssrDemo.innerHTML = sanitize(maliciousHTML).toString();

  // 2. Client Side / Trusted Types
  const clientDemo = document.getElementById('client-demo')!;
  // @ts-ignore
  clientDemo.innerHTML = j`<span><i>Native Trusted Types Applied Successfully</i></span>`.toTrusted();

  // 3. Secure JSON Injection
  const jsonDemo = document.getElementById('json-demo')!;
  const state = { 
    user: 'admin',
    bio: '</script><script>alert("JSON-Breakout-Attempt")</script>',
    meta: '"><img src=x onerror=alert(1)>'
  };
  jsonDemo.textContent = j.json(state).toString();

  // 4. List Rendering
  const listDemo = document.getElementById('list-demo')!;
  const items = ['Safe Content', '<b>Bold Label</b>', 'javascript:alert("Protocol-Attack")'];
  const listHTML = j`${items.map(i => j`<li>Processed: ${i}</li>`)}`;
  listDemo.innerHTML = listHTML.toString();

  // 5. URL Protocol Guard
  const urlDemo = document.getElementById('url-demo')!;
  const dangerousURL = "javascript:alert('pwned')";
  urlDemo.innerHTML = j`<a href="${dangerousURL}" style="color:var(--primary); text-decoration:none; font-weight:600;">Blocked Link (Click results in about:blank)</a>`.toString();

  // 6. Smart Minifier
  const minifyDemo = document.getElementById('minify-demo')!;
  const rawHTML = j`
    <div>
      <p>Whitespace below is gone, but...</p>
      <pre>
        This PRE text 
        maintains its 
        original spacing!
      </pre>
    </div>
  `;
  minifyDemo.innerHTML = rawHTML.toString();

  // 7. CSS Protection (Iron-Clad Lexical)
  const cssDemo = document.getElementById('css-demo')!;
  const maliciousStyle = 'red; background: url("javascript:alert(1)"); margin-inline-start: 2rem; color: \\6a avascript;';
  
  cssDemo.innerHTML = j`
    <div style="font-weight:600; color:var(--success); margin-bottom: 0.5rem;">Lexical Engine v1.4.0:</div>
    <div class="demo-box" style="${maliciousStyle}">
      <span>Sanitized Content with Logical Props & Hex-Decoding</span>
    </div>
    <div style="margin-top:0.5rem; font-size:0.8rem; color:var(--text-dim); font-family:monospace; word-break:break-all; background: var(--card-bg); padding: 8px; border-radius: 4px; border: 1px solid var(--border);">
      Raw: ${maliciousStyle}<br>
      <span style="color:var(--primary); margin-top:4px; display:block;">Result: ${j.css(maliciousStyle)}</span>
    </div>
  `.toString();

  // 8. Secure Nonce
  const nonceDemo = document.getElementById('nonce-demo')!;
  const sessionNonce = nonce();
  nonceDemo.innerHTML = j`
    <code>Generated Nonce:</code>
    <div style="margin-top:0.5rem; word-break:break-all; color:var(--success);">${sessionNonce}</div>
    <div style="margin-top:0.5rem; font-size:0.8rem; color:var(--text-dim);">Use this in your CSP Header and script tags.</div>
  `.toString();

  console.log(`--- Jaga Showcase v${version} Analysis ---`);
  console.log('Session Nonce:', sessionNonce);
  console.log('Trusted Output Sample:', j`<b>Test</b>`.toTrusted());
  console.log('------------------------------------');
});
