import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { j } from '../src/index';
import { sanitize } from '../src/sanitize';
import { JagaHTML } from '../src/core/types';

describe('Native Trusted Types Support', () => {
  const mockPolicy = {
    createHTML: vi.fn((s: string) => ({ __trusted: s })),
  };

  beforeEach(() => {
    // Mock window.trustedTypes
    vi.stubGlobal('window', {
      trustedTypes: {
        createPolicy: vi.fn(() => mockPolicy),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should use Trusted Types policy in j tag if available', () => {
    const result = j`<div>Hello</div>`;
    
    // @ts-ignore
    expect(window.trustedTypes.createPolicy).toHaveBeenCalledWith('jaga', expect.any(Object));
    expect(mockPolicy.createHTML).toHaveBeenCalled();
    expect(result.toTrusted()).toEqual({ __trusted: '<div>Hello</div>' });
  });

  it('should use Trusted Types policy in sanitize() if available', () => {
    const result = sanitize('<b>Bold</b>');
    
    expect(mockPolicy.createHTML).toHaveBeenCalled();
    expect(result.toTrusted()).toEqual({ __trusted: '<b>Bold</b>' });
  });

  it('should fallback to string if Trusted Types is not available', () => {
    vi.stubGlobal('window', {}); // No trustedTypes
    
    const result = j`<div>Hello</div>`;
    expect(result.toTrusted()).toBe('<div>Hello</div>');
  });

  it('should maintain both string and trusted value in JagaHTML', () => {
    const result = j`<div>Test</div>`;
    expect(result.toString()).toBe('<div>Test</div>');
    expect(result.toTrusted()).toEqual({ __trusted: '<div>Test</div>' });
  });
});
