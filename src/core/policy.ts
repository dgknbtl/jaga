/**
 * Centralized Trusted Types policy management.
 */

let _policy: any = null;

/**
 * Returns the global Jaga Trusted Types policy.
 * Returns null if the browser does not support Trusted Types or if on a server.
 */
export function getJagaPolicy() {
  if (typeof window === 'undefined') return null;
  
  // @ts-ignore
  const tt = window.trustedTypes;
  if (!tt || !tt.createPolicy) return null;

  if (!_policy) {
    try {
      _policy = tt.createPolicy('jaga', {
        createHTML: (s: string) => s,
      });
    } catch (e) {
      // Policy named 'jaga' might already exist or creation failed
      // In case of failure, we fallback to null to use strings
      return null;
    }
  }

  return _policy;
}
