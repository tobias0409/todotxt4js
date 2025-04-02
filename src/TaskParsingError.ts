/**
 * @fileoverview Defines the TaskParsingError class for error handling during parsing.
 * This custom error provides additional information about parse failures.
 * @module TaskParsingError
 */

/**
 * Custom error class for task parsing failures.
 * Extends the standard Error class with additional information about
 * where in the token stream the error occurred.
 */
export class TaskParsingError extends Error {
  /**
   * Creates a new TaskParsingError.
   * @param {string} message - Error message.
   * @param {number} [tokenIndex] - Optional index of the token where the error occurred.
   */
  constructor(message: string, public tokenIndex?: number) {
    super(message);
    this.name = "TaskParsingError";
  }
}
