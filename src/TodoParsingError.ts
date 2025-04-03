/**
 * @fileoverview Provides the TodoParsingError class for handling parser exceptions.
 * This class extends the standard Error class to include information about
 * where in the token stream an error occurred.
 * @module TodoParsingError
 */

/**
 * Error class for todo parsing errors.
 * Extends the standard Error class with additional information about
 * where in the token stream the error occurred.
 */
export class TodoParsingError extends Error {
  /** The index of the token where the error occurred */
  public tokenIndex?: number;

  /**
   * Creates a new TodoParsingError.
   * @param {string} message - Error message.
   * @param {number} [tokenIndex] - Optional index of the token where the error occurred.
   */
  constructor(message: string, tokenIndex?: number) {
    super(message);
    this.name = "TodoParsingError";
    this.tokenIndex = tokenIndex;
  }
}
