/**
 * @fileoverview Defines token types and the Token class for the todo.txt parser.
 * These tokens represent the various syntactic elements in the todo.txt format.
 * @module Token
 */

/**
 * Enum representing the different types of tokens in a todo.txt line.
 */
export enum TokenType {
  /** Completion marker "x" */
  COMPLETION,

  /** Priority marker "(A)" through "(Z)" */
  PRIORITY,

  /** Date in YYYY-MM-DD format */
  DATE,

  /** Project tag starting with "+" */
  PROJECT,

  /** Context tag starting with "@" */
  CONTEXT,

  /** Key-value pair key ending with a colon */
  KEY,

  /** Any other word (fallback) */
  WORD,
}

/**
 * Class representing a token in the todo.txt syntax.
 * A token is a fundamental unit of the text with a specific meaning.
 */
export class Token {
  /**
   * Creates a new Token.
   * @param {TokenType} type - The type of the token.
   * @param {string} value - The string value of the token.
   */
  constructor(public type: TokenType, public value: string) {}
}
