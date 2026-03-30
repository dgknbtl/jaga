import { describe, it, expect } from 'vitest';
import { j } from '../src/tags/template';

describe('Jaga CSS Protection', () => {
  it('should escape non-alphanumeric characters in style attributes', () => {
    const color = 'red; background: url(javascript:alert(1))';
    const output = j`<div style="color: ${color}"></div>`;
    
    // Check that special characters are hex-escaped
    expect(output.toString()).toContain('\\3b '); // semicolon
    expect(output.toString()).toContain('\\28 '); // opening parenthesis
    expect(output.toString()).not.toContain('javascript:');
  });

  it('should prevent CSS breakout using quotes', () => {
    const value = '"; background: red; "';
    const output = j`<div style="font-family: ${value}"></div>`;
    
    expect(output.toString()).toContain('\\22 '); // quote escaped
    expect(output.toString()).not.toContain('";');
  });

  it('should work with j.css() helper', () => {
    const cssValue = '100%; border: 1px solid red;';
    const safe = j.css(cssValue);
    
    expect(safe.toString()).toContain('\\25 ');
    expect(safe.toString()).toContain('\\3b ');
  });

  it('should preserve alphanumeric characters', () => {
    const font = 'Arial123';
    const output = j`<div style="font-family: ${font}"></div>`;
    expect(output.toString()).toContain('Arial123');
  });
});
