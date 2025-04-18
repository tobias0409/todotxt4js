/**
 * @fileoverview Provides the Parser class for converting tokens into Todo objects.
 * This file includes the Parser class and supporting interfaces for configuring parsing behavior
 * and handling custom key transformations.
 * @module Parser
 */

import { Token, TokenType } from "./Token";
import { TodoParsingError } from "./TodoParsingError";
import { Todo } from "./Todo";

/**
 * Interface for custom key handlers.
 * Allows validation and transformation of key-value pairs.
 */
export interface KeyHandler {
  /** The key name to handle (without the colon) */
  key: string;

  /** Optional function to validate values for this key */
  validate?: (value: string) => boolean;

  /** Optional function to transform values for this key */
  transform?: (value: string) => any;
}

/**
 * Configuration options for the parser.
 */
export interface ParserOptions {
  /**
   * How to handle duplicate keys:
   * - "error": throw an error on duplicate key
   * - "overwrite": replace the previous value
   * - "merge": store duplicate values in an array
   */
  duplicateKeyBehavior?: "error" | "overwrite" | "merge";

  /** Array of custom handlers for specific keys */
  customKeyHandlers?: KeyHandler[];
}

/**
 * Parser class that converts tokens into a Todo object.
 * Processes token sequences to build a structured Todo representation.
 */
export class Parser {
  /** Current position in the token stream */
  private pos: number = 0;

  /** Parser configuration options */
  private options: ParserOptions;

  /**
   * Creates a new Parser instance.
   * @param {Token[]} tokens - Array of tokens to parse.
   * @param {ParserOptions} [options] - Optional configuration.
   */
  constructor(private tokens: Token[], options?: ParserOptions) {
    // Set defaults if not provided.
    this.options = {
      duplicateKeyBehavior: "overwrite",
      customKeyHandlers: [],
      ...options,
    };
  }

  /**
   * Parses the tokens into a Todo object.
   * @returns {Todo} The parsed Todo.
   * @throws {TodoParsingError} If parsing fails.
   */
  public parseTodo(): Todo {
    // Reset position for each parse
    this.pos = 0;

    const todo = new Todo();

    // Process optional completion marker.
    if (this.match(TokenType.COMPLETION)) {
      todo.completed = true;
      this.consume();
    }

    // Process optional priority.
    if (this.match(TokenType.PRIORITY)) {
      todo.setPriority(this.currentToken()!.value);
      this.consume();
    }

    // Process date tokens.
    if (this.match(TokenType.DATE)) {
      if (todo.completed) {
        todo.completionDate = this.currentToken()!.value;
      } else {
        todo.creationDate = this.currentToken()!.value;
      }
      this.consume();
    }

    // For completed todos, a second DATE token is the creation date.
    if (todo.completed && this.match(TokenType.DATE)) {
      todo.creationDate = this.currentToken()!.value;
      this.consume();
    }

    // Process the rest as description tokens.
    const descriptionParts: string[] = [];
    while (!this.isAtEnd()) {
      // Handle key-value pairs.
      if (this.match(TokenType.KEY) && !this.isAtEnd(1)) {
        const keyToken = this.consume();
        const keyName = keyToken.value.slice(0, -1); // Remove trailing colon.
        const valueToken = this.consume();
        let value: any = valueToken.value;

        // Apply custom key handlers if available.
        if (
          this.options.customKeyHandlers &&
          this.options.customKeyHandlers.length > 0
        ) {
          const handler = this.options.customKeyHandlers.find(
            (h) => h.key === keyName
          );
          if (handler) {
            if (handler.validate && !handler.validate(value)) {
              throw new TodoParsingError(
                `Validation failed for key '${keyName}' with value '${value}'`
              );
            }
            if (handler.transform) {
              value = handler.transform(value);
            }
          }
        }

        // Handle duplicate keys.
        if (keyName in todo.keyValues) {
          switch (this.options.duplicateKeyBehavior) {
            case "error":
              throw new TodoParsingError(
                `Duplicate key '${keyName}' encountered`
              );
            case "merge":
              if (!todo.keyValues[keyName]) {
                todo.setKeyValue(keyName, value);
              } else if (Array.isArray(todo.keyValues[keyName])) {
                todo.setKeyValue(keyName, [...todo.keyValues[keyName], value]);
              } else {
                const existingValue = todo.keyValues[keyName];
                todo.setKeyValue(keyName, [existingValue, value]);
              }
              break;
            case "overwrite":
            default:
              todo.setKeyValue(keyName, value);
              break;
          }
        } else {
          todo.setKeyValue(keyName, value);
        }
      } else {
        const token = this.consume();
        descriptionParts.push(token.value);
        // Capture projects and contexts.
        if (token.type === TokenType.PROJECT) {
          todo.addProject(token.value);
        } else if (token.type === TokenType.CONTEXT) {
          todo.addContext(token.value);
        }
      }
    }

    todo.setDescription(descriptionParts.join(" ").trim());
    return todo;
  }

  /**
   * Checks if the current token matches a given type.
   * @param {TokenType} type - The token type to check for.
   * @returns {boolean} True if current token matches the type.
   * @private
   */
  private match(type: TokenType): boolean {
    const token = this.currentToken();
    return token !== null && token.type === type;
  }

  /**
   * Returns true if there is no token at pos+offset.
   * @param {number} [offset=0] - Optional offset from current position.
   * @returns {boolean} True if position is past end of tokens.
   * @private
   */
  private isAtEnd(offset: number = 0): boolean {
    return this.pos + offset >= this.tokens.length;
  }

  /**
   * Returns the current token or null if out of bounds.
   * @returns {Token|null} Current token or null.
   * @private
   */
  private currentToken(): Token | null {
    return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
  }

  /**
   * Returns the current token and advances the pointer.
   * @returns {Token} Current token before advancing.
   * @private
   */
  private consume(): Token {
    return this.tokens[this.pos++];
  }
}
