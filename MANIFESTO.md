# 🛡️ Jaga: Vision, Mission, and Manifesto

## Vision

To make context-aware data handling the standard for string-based HTML templates. To provide a simplified structure in the JavaScript ecosystem that prevents XSS vulnerabilities right at the coding stage without slowing down the developer, making security a "default behavior" rather than an afterthought.

## Mission

To provide developers with a zero-dependency, lightweight, and smart template engine and sanitizer for the interactions between user data and the DOM. To create a transparent security layer with zero learning curve, especially for Vanilla JS, SSR processes, and the blind spots that modern frameworks leave behind (e.g., `dangerouslySetInnerHTML`).

---

## The Jaga Manifesto

**1. Don't audit your security. Write it.**
Instead of testing whether an application is secure after the fact, we must use tools that help write secure code from the start. Jaga places this philosophy at the very center of the templating process.

**2. Frictionless Security**
Security tools should not make coding harder or impose complex APIs. Operating with just a `j` tag, Jaga does its job in the background without adding any extra burden on the developer.

**3. Zero-dependency, Maximum Speed**
In an era where the web is getting heavier, basic security measures should not bloat bundle sizes. Our absolute goal is always to provide maximum protection with zero dependencies and a minimal file size (<3KB).

**4. Context is Everything**
Security is not blindly escaping characters. The risk profile changes depending on where the data lands (an `href` attribute, a `<script>` tag, or plain text). Jaga parses the context and applies only the escaping rules appropriate for that specific context.

**5. Fixing the Blind Spots**
While modern frameworks handle many security tasks natively, they leave the responsibility entirely to the developer wherever raw HTML is injected. Our goal is to secure those exact boundaries without compromising flexibility.
