/**
 * Jaga Lexical CSS Sanitizer (v1.4.0)
 * "Iron-Clad" Minimalist Implementation for inline style attributes.
 * Focus: Maximum Security, Minimum Footprint (<3KB target).
 */

export type CSSValue =
  | { type: "ident"; value: string }
  | { type: "string"; value: string }
  | { type: "num"; value: number; unit: string }
  | { type: "func"; name: string; args: CSSValue[][] };

// Strict Longhands
const SAFE_PROPERTIES = new Set([
  "color",
  "background-color",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "text-align",
  "text-decoration",
  "text-transform",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "display",
  "visibility",
  "opacity",
  "width",
  "height",
  "max-width",
  "max-height",
  "min-width",
  "min-height",
  "border-color",
  "border-width",
  "border-style",
  "border-radius",
  "line-height",
  "letter-spacing",
  "vertical-align",
  "cursor",
  "z-index",
  "overflow",
  "overflow-x",
  "overflow-y",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "content",
  "margin-inline-start",
  "margin-inline-end",
  "margin-block-start",
  "margin-block-end",
  "padding-inline-start",
  "padding-inline-end",
  "padding-block-start",
  "padding-block-end",
  "inset-inline-start",
  "inset-inline-end",
  "inset-block-start",
  "inset-block-end",
  "inline-size",
  "block-size",
  "min-inline-size",
  "min-block-size",
  "max-inline-size",
  "max-block-size",
]);

// Context-aware Safe Functions
const SAFE_FUNCTIONS = new Set(["rgb", "rgba", "hsl", "hsla", "url"]);
const SAFE_PROTOCOLS = ["https:", "data:image/"];

function decodeCSSEscape(hex: string): string {
  if (!hex) return "";
  if (hex.length === 1 && !/[0-9a-fA-F]/.test(hex)) return hex;
  try {
    const code = parseInt(hex, 16);
    return isNaN(code) || code < 0 || code > 0x10ffff
      ? "\uFFFD"
      : String.fromCodePoint(code);
  } catch {
    return "\uFFFD";
  }
}

function tokenize(css: string) {
  const tokens: any[] = [];
  let i = 0;
  while (i < css.length) {
    const char = css[i];
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    if (char === "/" && css[i + 1] === "*") {
      i += 2;
      while (i < css.length && !(css[i] === "*" && css[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (char === '"' || char === "'") {
      const quote = char;
      let val = "";
      i++;
      while (i < css.length && css[i] !== quote) {
        if (css[i] === "\\") {
          const m = css.slice(i).match(/^\\(?:[0-9a-fA-F]{1,6}\s?|.)/);
          if (m) {
            val += decodeCSSEscape(m[0].slice(1));
            i += m[0].length;
            continue;
          }
        }
        val += css[i++];
      }
      tokens.push({ type: "string", value: val });
      i++;
      continue;
    }
    if (/[a-zA-Z_-]/.test(char) || char === "\\") {
      let val = "";
      while (
        i < css.length &&
        (/[a-zA-Z0-9_-]/.test(css[i]) || css[i] === "\\")
      ) {
        if (css[i] === "\\") {
          const m = css.slice(i).match(/^\\(?:[0-9a-fA-F]{1,6}\s?|.)/);
          if (m) {
            val += decodeCSSEscape(m[0].slice(1));
            i += m[0].length;
            continue;
          }
        }
        val += css[i++];
      }
      tokens.push({ type: "ident", value: val });
      continue;
    }
    if (/[0-9.-]/.test(char)) {
      const m = css.slice(i).match(/^-?[0-9]*\.?[0-9]+/);
      if (m) {
        const num = parseFloat(m[0]);
        i += m[0].length;
        let unit = "";
        while (i < css.length && /[a-zA-Z%]/.test(css[i])) unit += css[i++];
        tokens.push({ type: "num", value: num, unit });
        continue;
      }
    }
    tokens.push({ type: "delim", value: char });
    i++;
  }
  return tokens;
}

function parseValues(
  tokens: any[],
  start: number,
  stops: string[] = [";", "}"],
): [CSSValue[], number] {
  const values: CSSValue[] = [];
  let i = start;
  while (i < tokens.length && !stops.includes(tokens[i].value)) {
    const t = tokens[i];
    if (t.type === "ident" && tokens[i + 1]?.value === "(") {
      const name = t.value;
      i += 2;
      const args: CSSValue[][] = [[]];
      while (i < tokens.length && tokens[i].value !== ")") {
        if (tokens[i].value === ",") {
          args.push([]);
          i++;
          continue;
        }
        const [sub, next] = parseValues(tokens, i, [",", ")", ";", "}"]);
        args[args.length - 1].push(...sub);
        i = next > i ? next : i + 1;
      }
      values.push({ type: "func", name, args });
      if (tokens[i]?.value === ")") i++;
    } else if (t.type !== "delim") {
      values.push(t);
      i++;
    } else {
      i++;
    }
  }
  return [values, i];
}

const isSafeURL = (url: string) =>
  SAFE_PROTOCOLS.some((p) => url.toLowerCase().startsWith(p));

const validateValue = (v: CSSValue): boolean => {
  if (v.type === "func") {
    if (!SAFE_FUNCTIONS.has(v.name)) return false;
    if (v.name === "url")
      return (
        v.args[0]?.[0]?.type === "string" &&
        isSafeURL((v.args[0][0] as any).value)
      );
    v.args.forEach((g) =>
      g.forEach((child, idx) => {
        if (!validateValue(child)) g[idx] = { type: "ident", value: "" };
      }),
    );
    return true;
  }
  return v.type === "ident" || v.type === "string"
    ? !/[;:{}\\]/.test((v as any).value)
    : true;
};

const serializeValue = (v: CSSValue): string => {
  if (v.type === "ident") return v.value;
  if (v.type === "num") return `${v.value}${v.unit}`;
  if (v.type === "string") return `"${v.value}"`;
  if (v.type === "func")
    return `${v.name}(${v.args.map((g) => g.map(serializeValue).join(" ")).join(",")})`;
  return "";
};

/**
 * Modern Iron-Clad CSS Sanitizer (Strict Only)
 */
export function sanitizeCSS(css: string): string {
  if (!css) return "";
  const tokens = tokenize(css);
  let result = "";
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (
      t.type === "ident" &&
      tokens[i + 1]?.value === ":" &&
      SAFE_PROPERTIES.has(t.value)
    ) {
      const prop = t.value;
      i += 2;
      const [values, next] = parseValues(tokens, i);
      const safe = values
        .filter((v) => validateValue(v))
        .map((v) => serializeValue(v))
        .join(" ");
      if (safe) result += `${prop}:${safe};`;
      i = next;
    }
  }
  return result;
}

export function sanitizeCSSValue(val: string): string {
  if (!val) return "";
  const tokens = tokenize(`p:${val}`);
  const [values] = parseValues(tokens, 2);
  return values
    .filter((v) => validateValue(v))
    .map((v) => serializeValue(v))
    .join(" ");
}
