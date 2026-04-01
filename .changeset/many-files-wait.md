---
"jagajs": patch
---

Fixed three security vulnerabilities: encoded protocol bypass in safeUrl, multi-argument url() bypass in CSS sanitizer, and insecure Math.random() fallback in nonce generation. Hardened release tooling with fail-fast error handling and robust CHANGELOG parsing.
