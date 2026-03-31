---
name: Jaga Core Concept
description: Security, performance, and lightweight standards for developing the Jaga library.
---

# Jaga Core Skill

This skill is designed to maintain security, performance, and lightweight standards during the development of the **Jaga** library.

## Principles

### 1. Security-First
- **Escaping**: All dynamic variables must be escaped to include the following characters:
    - `&` -> `&amp;`
    - `<` -> `&lt;`
    - `>` -> `&gt;`
    - `"` -> `&quot;`
    - `'` -> `&#39;` (or `&apos;`)
- **Context-Specific Validation**: Always identify where the data is being injected (attribute vs child node). Even escaped data can be dangerous if placed in a sensitive attribute (like `href` or `onX`).
- **No Double-Escape**: Content returned from the `j` function should not be escaped again. Content is marked with a `JagaHTML` class or a unique symbol.
- **Trusted Types**: Must be compatible with modern browsers' `TrustedHTML` API. Policy name: `jaga`.

### 2. Ultra-Lightweight & High-Performance
- **Target**: Gzipped bundle size < 1KB for the core operations.
- **Method**: 
    - No external dependencies (zero-dependency).
    - Avoid unnecessary abstractions.
    - Prefer modern ES6+ features, but strictly avoid TS features that bloat the compiled JS (like Enums).
    - **Micro-Perf Analysis**: Target maximum runtime speed. Use primitive JS loops (`for`) and fast algorithmic operations (e.g., `charCodeAt`) over heavy or chained regexes when parsing and sanitizing.
    - Use minification-friendly variable names and structures.

### 3. List and Array Processing
- Arrays within templates must be automatically joined (`join('')`).
- Each element in the array must be processed according to the security rules above.

## Code Standards
- **TypeScript**: All parameters and return values must have explicit types.
- **Isomorphic Execution**: Code logic must decouple browser-specific objects (like `window` or `document`) so it executes safely in a Node/Bun context as a raw string builder.
- **Tests**: 100% test coverage is mandatory. Pay special attention to adversarial inputs (mutation XSS vectors, double-encodings, DOM clobbering).
