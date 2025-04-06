/**
 * @fileoverview Provides the Scanner class for tokenizing todo.txt lines.
 * The Scanner breaks down text lines into tokens representing different
 * parts of a todo.txt task format.
 * @module Scanner
 */

import { Token, TokenType } from "./Token";

/**
 * Scanner class that splits todo.txt lines into tokens.
 * Identifies different components like completion markers, priorities,
 * dates, projects, contexts, and key-value pairs.
 * Uses character-by-character parsing instead of regex for compatibility.
 */
export class Scanner {
  /**
   * Scans a line of text and produces an array of tokens.
   * @param {string} line - The line of text to scan.
   * @returns {Token[]} Array of tokens representing the line.
   */
  public scan(line: string): Token[] {
    const tokens: Token[] = [];
    // Split the line on whitespace
    const parts = this.splitByWhitespace(line);

    // Process each part
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      // Check for combined key-value pair (like due:2023-04-01)
      const keyValue = this.tryExtractKeyValue(part);
      if (keyValue) {
        tokens.push(new Token(TokenType.KEY, keyValue.key + ":"));

        // Determine the type of the value
        let valueToken = this.classifyToken(keyValue.value, i, parts);
        tokens.push(valueToken);
        continue;
      }

      // Otherwise process the token normally
      const token = this.classifyToken(part, i, parts);
      tokens.push(token);
    }

    return tokens;
  }

  /**
   * Classifies a token based on its content and position
   * @param part - The text part to classify
   * @param position - Position in the parts array
   * @param allParts - All parts from the line
   * @returns The classified token
   * @private
   */
  private classifyToken(
    part: string,
    position: number,
    allParts: string[] = []
  ): Token {
    // Special case for PRIORITY
    if (this.isPriority(part)) {
      // PRIORITY must be at position 0, or at position 1 after a completion marker
      if (position === 0 || (position === 1 && allParts[0] === "x")) {
        return new Token(TokenType.PRIORITY, part);
      } else {
        return new Token(TokenType.WORD, part);
      }
    }

    // Check other token types
    if (part === "x" && position === 0) {
      return new Token(TokenType.COMPLETION, part);
    } else if (this.isDate(part)) {
      return new Token(TokenType.DATE, part);
    } else if (this.isProject(part)) {
      return new Token(TokenType.PROJECT, part);
    } else if (this.isContext(part)) {
      return new Token(TokenType.CONTEXT, part);
    } else if (this.isKey(part)) {
      return new Token(TokenType.KEY, part);
    } else {
      return new Token(TokenType.WORD, part);
    }
  }

  /**
   * Splits a string by whitespace without using regex
   * @param line - The line to split
   * @returns Array of parts
   * @private
   */
  private splitByWhitespace(line: string): string[] {
    const parts: string[] = [];
    let currentPart = "";
    let inWhitespace = true;

    // Split the string into parts (handling whitespace)
    for (let i = 0; i < line.length; i++) {
      if (this.isWhitespace(line[i])) {
        if (!inWhitespace && currentPart) {
          parts.push(currentPart);
          currentPart = "";
        }
        inWhitespace = true;
      } else {
        currentPart += line[i];
        inWhitespace = false;
      }
    }

    // Add the last part if needed
    if (currentPart) {
      parts.push(currentPart);
    }

    return parts;
  }

  /**
   * Checks if a string matches the priority format (A) to (Z)
   * @param str - String to check
   * @returns True if it's a valid priority
   * @private
   */
  private isPriority(str: string): boolean {
    if (str.length !== 3) return false;
    if (str[0] !== "(" || str[2] !== ")") return false;
    return this.isUppercaseLetter(str[1]);
  }

  /**
   * Checks if a string matches the YYYY-MM-DD date format
   * @param str - String to check
   * @returns True if it's a valid date format
   * @private
   */
  private isDate(str: string): boolean {
    // Check format YYYY-MM-DD
    if (str.length !== 10) return false;
    if (str[4] !== "-" || str[7] !== "-") return false;

    // Check digits
    for (let i = 0; i < 10; i++) {
      if (i === 4 || i === 7) continue; // Skip hyphens
      if (!this.isDigit(str[i])) return false;
    }

    return true;
  }

  /**
   * Checks if a string is a project tag
   * @param str - String to check
   * @returns True if it starts with +
   * @private
   */
  private isProject(str: string): boolean {
    return str.length > 1 && str[0] === "+";
  }

  /**
   * Checks if a string is a context tag
   * @param str - String to check
   * @returns True if it starts with @
   * @private
   */
  private isContext(str: string): boolean {
    return str.length > 1 && str[0] === "@";
  }

  /**
   * Checks if a string is a key (ends with colon)
   * @param str - String to check
   * @returns True if it's a valid key
   * @private
   */
  private isKey(str: string): boolean {
    if (!str.endsWith(":")) return false;
    const prefix = str.substring(0, str.length - 1);
    return this.isValidKeyPrefix(prefix);
  }

  /**
   * Tries to extract a key-value pair from a string
   * @param str - String to check
   * @returns Object with key and value or null
   * @private
   */
  private tryExtractKeyValue(
    str: string
  ): { key: string; value: string } | null {
    // Look for the first colon
    let colonIndex = -1;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === ":") {
        colonIndex = i;
        break;
      }
    }

    if (colonIndex <= 0 || colonIndex === str.length - 1) return null; // No colon, empty key, or empty value

    const key = str.substring(0, colonIndex);
    if (!this.isValidKeyPrefix(key)) return null;

    const value = str.substring(colonIndex + 1);
    return { key, value };
  }

  /**
   * Checks if a character is whitespace
   * @param char - Character to check
   * @returns True if it's whitespace
   * @private
   */
  private isWhitespace(char: string): boolean {
    return char === " " || char === "\t";
  }

  /**
   * Checks if a character is a digit
   * @param char - Character to check
   * @returns True if it's a digit
   * @private
   */
  private isDigit(char: string): boolean {
    return char >= "0" && char <= "9";
  }

  /**
   * Checks if a character is a letter
   * @param char - Character to check
   * @returns True if it's a letter
   * @private
   */
  private isLetter(char: string): boolean {
    return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z");
  }

  /**
   * Checks if a character is an uppercase letter
   * @param char - Character to check
   * @returns True if it's an uppercase letter
   * @private
   */
  private isUppercaseLetter(char: string): boolean {
    return char >= "A" && char <= "Z";
  }

  /**
   * Validates a key prefix (should be letters only)
   * @param str - String to validate
   * @returns True if valid
   * @private
   */
  private isValidKeyPrefix(str: string): boolean {
    // Check only letters a-zA-Z
    for (let i = 0; i < str.length; i++) {
      if (!this.isLetter(str[i])) return false;
    }
    return str.length > 0;
  }
}
