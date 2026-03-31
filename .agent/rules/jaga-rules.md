---
trigger: always_on
description: Jaga project-specific development and security rules.
---

# 🛡️ Jaga Development Rules

Jaga follows strict security and architectural rules.

## Core Architectural Rules

- **Zero Dependency**: Never add external dependencies to the core engine.
- **Isomorphic Support**: All core features must work in both Browser and SSR (Node/Bun/Deno) environments.
- **Size Constraint & Micro-Optimizations**: Keep the core + sanitizer bundle size under 3KB gzipped. Avoid syntax that compiles to heavy JS (e.g., prefer Union Types/POJOs over TS Enums, use raw string/char manipulation primitives for optimal minification and speed).
- **Modular Structure**: Follow the established `src/core`, `src/tags`, and `src/sanitize` structure.

## Security Standards

- **Manifesto Alignment**: Every change must align with the Jaga Manifesto (Context-aware, DX-first, etc.).
- **JagaHTML Wrapper**: All functions returning HTML must return a `JagaHTML` instance, never a raw string.
- **Context-Aware Escaping**: Escaping must consider the DOM injection context. InnerHTML, attributes, and script tags have different threat thresholds. Check the context before applying sanitizations.
- **Trusted Types**: Always ensure native Trusted Types compatibility for browser-side outputs.
- **No Insecure Fallbacks**: Security warnings should strictly guide the user towards CSP-compliant patterns.

## Testing & Quality

- **Malicious Payload Mandate**: Every new feature or bug fix MUST include explicit test cases containing known malicious payloads (e.g., SVG onload, `javascript:` URIs) to prove impenetrable sanitization.
- **100% Coverage**: Focus explicitly on edge cases, context-switching bypasses, and double-escaping bugs.

## Documentation & Showcase

- **Showcase Synchronization**: Every functional change or new feature MUST be reflected in the `/showcase` directory.
- **SSR vs Client Examples**: The showcase must demonstrate how the feature behaves in both SSR (server-ready strings) and Client-side (Trusted Types) contexts.
- **README Update**: Keep the README features and compatibility table in sync with the current version.
