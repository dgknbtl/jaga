/**
 * SafeHTML wrapper class to identify already-processed/safe content.
 * Prevents double-escaping and integrates with Trusted Types.
 */
export class JagaHTML {
  private value: string;
  private trusted?: any; // Holds TrustedHTML in supported environments

  constructor(value: string, trusted?: any) {
    this.value = value;
    this.trusted = trusted;
  }

  /**
   * Returns the processed string.
   */
  toString(): string {
    return this.value;
  }

  /**
   * Returns the TrustedHTML object if available, otherwise returns the string.
   * Useful for assignment to innerHTML in Trusted Types environments.
   */
  toTrusted(): any {
    return this.trusted || this.value;
  }

  /**
   * Ensures the object can be safely stringified in JSON.
   */
  toJSON() {
    return this.value;
  }
}
