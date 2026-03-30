import { describe, expect, it } from "vitest";
import { sanitizeCSS } from "../src/core/css";
import { j } from "../src/tags/template";

describe("Jaga Lexical CSS Sanitizer (v1.4.0)", () => {
  describe("Core Logic", () => {
    it("should allow explicitly safe longhand and logical properties", () => {
      const input = "color: red; margin-inline-start: 10px; padding-block-end: 2rem;";
      const result = sanitizeCSS(input);
      expect(result).toContain("color:red;");
      expect(result).toContain("margin-inline-start:10px;");
      expect(result).toContain("padding-block-end:2rem;");
    });

    it("should block shorthand properties (Allowlist-driven)", () => {
      const input = "background: red; border: 1px solid black; color: blue;";
      const result = sanitizeCSS(input);
      expect(result).not.toContain("background:");
      expect(result).not.toContain("border:");
      expect(result).toContain("color:blue;");
    });

    it("should decode hex escapes cleanly", () => {
      const input = "color: \\6a avascript";
      const result = sanitizeCSS(input);
      expect(result).toContain("color:javascript;");
    });

    it("should block unauthorized functions", () => {
      const input = "color: red; margin-top: calc(10px + 20px); width: expression(alert(1));";
      const result = sanitizeCSS(input);
      expect(result).not.toContain("calc");
      expect(result).not.toContain("expression");
      expect(result).toContain("color:red;");
    });

    it("should allow safe color functions", () => {
      const input = "background-color: rgb(255, 0, 0); color: hsl(120, 100%, 50%);";
      const result = sanitizeCSS(input);
      expect(result).toContain("background-color:rgb(255,0,0);");
      expect(result).toContain("color:hsl(120,100%,50%);");
    });

    it("should block escape breakout attempts (Boundary Enforcement)", () => {
      const input = "color: \\3a ; margin-top: 10px";
      const result = sanitizeCSS(input);
      expect(result).not.toContain("color:"); 
      expect(result).toContain("margin-top:10px;");
    });

    it("should fully conform to CSS Escape Sequence Spec", () => {
      expect(sanitizeCSS("font-family: \\00006a avascript;")).toContain("font-family:javascript;");
      expect(sanitizeCSS('content: "\\!";')).toContain('content:"!";');
    });
  });

  describe("Template Tag Integration", () => {
    it("should block dangerous CSS injections in style attributes via j tag", () => {
      const color = 'color: red; background-image: url(javascript:alert(1))';
      const output = j`<div style="${color}"></div>`;
      expect(output.toString()).toContain('color:red;');
      expect(output.toString()).not.toContain('javascript:');
      expect(output.toString()).not.toContain('background-image:');
    });

    it("should prevent CSS breakout using quotes", () => {
      const value = '"; color: red; "';
      const output = j`<div style="font-family: ${value}"></div>`;
      expect(output.toString()).not.toContain('color:red;');
      expect(output.toString()).toBe('<div style="font-family: "></div>');
    });

    it("should work with j.css() helper", () => {
      const cssValue = 'color: red; padding-top: 10px;';
      const safe = j.css(cssValue);
      expect(safe.toString()).toContain('color:red;');
      expect(safe.toString()).toContain('padding-top:10px;');
    });
  });
});
