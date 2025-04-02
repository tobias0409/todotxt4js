import { Token, TokenType } from "./Token";
import { TaskParsingError } from "./TaskParsingError";
import { Task } from "./Task";

/**
 * Interface for custom key handlers.
 */
export interface KeyHandler {
  key: string; // e.g. "due"
  validate?: (value: string) => boolean;
  transform?: (value: string) => any;
}

/**
 * Options for the parser.
 * duplicateKeyBehavior:
 *  - "error": throw an error on duplicate key.
 *  - "overwrite": replace the previous value.
 *  - "merge": store duplicate values in an array.
 */
export interface ParserOptions {
  duplicateKeyBehavior?: "error" | "overwrite" | "merge";
  customKeyHandlers?: KeyHandler[];
}

/**
 * The Parser produces a Task instance.
 */
export class Parser {
  private pos: number = 0;
  private options: ParserOptions;

  constructor(private tokens: Token[], options?: ParserOptions) {
    // Set defaults if not provided.
    this.options = {
      duplicateKeyBehavior: "overwrite",
      customKeyHandlers: [],
      ...options,
    };
  }

  public parseTask(): Task {
    const task = new Task();

    // Process optional completion marker.
    if (this.match(TokenType.COMPLETION)) {
      task.completed = true;
      this.consume();
    }

    // Process optional priority.
    if (this.match(TokenType.PRIORITY)) {
      task.priority = this.currentToken()!.value;
      this.consume();
    }

    // Process date tokens.
    if (this.match(TokenType.DATE)) {
      if (task.completed) {
        task.completionDate = this.currentToken()!.value;
      } else {
        task.creationDate = this.currentToken()!.value;
      }
      this.consume();
    }
    // For completed tasks, a second DATE token is the creation date.
    if (task.completed && this.match(TokenType.DATE)) {
      task.creationDate = this.currentToken()!.value;
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
        if (this.options.customKeyHandlers) {
          const handler = this.options.customKeyHandlers.find(
            (h) => h.key === keyName
          );
          if (handler) {
            if (handler.validate && !handler.validate(value)) {
              throw new TaskParsingError(
                `Validation failed for key '${keyName}' with value '${value}'.`
              );
            }
            if (handler.transform) {
              value = handler.transform(value);
            }
          }
        }

        // Handle duplicate keys.
        if (task.keyValues.hasOwnProperty(keyName)) {
          switch (this.options.duplicateKeyBehavior) {
            case "error":
              throw new TaskParsingError(
                `Duplicate key '${keyName}' encountered.`
              );
            case "merge":
              if (!Array.isArray(task.keyValues[keyName])) {
                task.keyValues[keyName] = [task.keyValues[keyName]];
              }
              task.keyValues[keyName].push(value);
              break;
            case "overwrite":
            default:
              task.keyValues[keyName] = value;
              break;
          }
        } else {
          task.keyValues[keyName] = value;
        }
      } else {
        const token = this.consume();
        descriptionParts.push(token.value);
        // Capture projects and contexts.
        if (token.type === TokenType.PROJECT) {
          task.projects.push(token.value);
        } else if (token.type === TokenType.CONTEXT) {
          task.contexts.push(token.value);
        }
      }
    }
    task.description = descriptionParts.join(" ").trim();
    return task;
  }

  // Helper: checks if the current token matches a given type.
  private match(type: TokenType): boolean {
    const token = this.currentToken();
    return token !== null && token.type === type;
  }

  // Helper: returns true if there is no token at pos+offset.
  private isAtEnd(offset: number = 0): boolean {
    return this.pos + offset >= this.tokens.length;
  }

  // Helper: returns the current token (or null if out of bounds).
  private currentToken(): Token | null {
    return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
  }

  // Helper: returns the current token and advances the pointer.
  private consume(): Token {
    return this.tokens[this.pos++];
  }
}
