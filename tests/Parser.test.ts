import { describe, it, expect, beforeEach } from "@jest/globals";
import { Scanner } from "../src/Scanner";
import { Parser, ParserOptions, KeyHandler } from "../src/Parser";
import { TodoParsingError } from "../src/TodoParsingError";
import { Token, TokenType } from "../src/Token";

describe("Parser Advanced Features", () => {
  let scanner: Scanner;

  beforeEach(() => {
    scanner = new Scanner();
  });

  describe("Parser Options", () => {
    describe("Duplicate Key Behavior", () => {
      const todoWithDuplicateKeys =
        "(A) Test todo due:2023-04-01 due:2023-05-01";

      it("should throw error for duplicate keys with 'error' behavior", () => {
        const tokens = scanner.scan(todoWithDuplicateKeys);
        const parser = new Parser(tokens, { duplicateKeyBehavior: "error" });

        expect(() => parser.parseTodo()).toThrow(TodoParsingError);
        expect(() => parser.parseTodo()).toThrow(/Duplicate key/);
      });

      it("should overwrite values with 'overwrite' behavior", () => {
        const tokens = scanner.scan(todoWithDuplicateKeys);
        const parser = new Parser(tokens, {
          duplicateKeyBehavior: "overwrite",
        });

        const todo = parser.parseTodo();
        expect(todo.keyValues["due"]).toBe("2023-05-01");
      });

      it("should merge values into array with 'merge' behavior", () => {
        const tokens = scanner.scan(todoWithDuplicateKeys);
        const parser = new Parser(tokens, { duplicateKeyBehavior: "merge" });

        const todo = parser.parseTodo();
        expect(Array.isArray(todo.keyValues["due"])).toBe(true);
        expect(todo.keyValues["due"]).toEqual(["2023-04-01", "2023-05-01"]);
      });
    });

    describe("Custom Key Handlers", () => {
      it("should validate keys using custom handler", () => {
        const keyHandler: KeyHandler = {
          key: "due",
          validate: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value),
        };

        // Valid date should parse successfully
        const validTokens = scanner.scan("Todo due:2023-04-01");
        const validParser = new Parser(validTokens, {
          customKeyHandlers: [keyHandler],
        });
        expect(() => validParser.parseTodo()).not.toThrow();

        // Invalid date should throw validation error
        const invalidTokens = scanner.scan("Todo due:01-04-2023");
        const invalidParser = new Parser(invalidTokens, {
          customKeyHandlers: [keyHandler],
        });
        expect(() => invalidParser.parseTodo()).toThrow(TodoParsingError);
        expect(() => invalidParser.parseTodo()).toThrow(/Validation failed/);
      });

      it("should transform values using custom handler", () => {
        const keyHandler: KeyHandler = {
          key: "priority",
          transform: (value) => parseInt(value),
        };

        const tokens = scanner.scan("Todo priority:5");
        const parser = new Parser(tokens, { customKeyHandlers: [keyHandler] });

        const todo = parser.parseTodo();
        expect(typeof todo.keyValues["priority"]).toBe("number");
        expect(todo.keyValues["priority"]).toBe(5);
      });

      it("should apply multiple custom handlers", () => {
        const handlers: KeyHandler[] = [
          {
            key: "due",
            validate: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value),
            transform: (value) => new Date(value),
          },
          {
            key: "priority",
            transform: (value) => parseInt(value),
          },
        ];

        const tokens = scanner.scan("Todo due:2023-04-01 priority:5");
        const parser = new Parser(tokens, { customKeyHandlers: handlers });

        const todo = parser.parseTodo();
        expect(todo.keyValues["due"] instanceof Date).toBe(true);
        expect(todo.keyValues["due"].getFullYear()).toBe(2023);
        expect(typeof todo.keyValues["priority"]).toBe("number");
        expect(todo.keyValues["priority"]).toBe(5);
      });
    });
  });

  describe("Token Processing", () => {
    it("should handle empty token arrays", () => {
      const parser = new Parser([], {});
      const todo = parser.parseTodo();

      expect(todo).toBeDefined();
      expect(todo.description).toBe("");
    });

    it("should correctly assign completion date and creation date", () => {
      // x (A) 2023-04-01 2023-03-15 Todo description
      const tokens = [
        new Token(TokenType.COMPLETION, "x"),
        new Token(TokenType.PRIORITY, "(A)"),
        new Token(TokenType.DATE, "2023-04-01"),
        new Token(TokenType.DATE, "2023-03-15"),
        new Token(TokenType.WORD, "Todo"),
        new Token(TokenType.WORD, "description"),
      ];

      const parser = new Parser(tokens);
      const todo = parser.parseTodo();

      expect(todo.completed).toBe(true);
      expect(todo.priority).toBe("(A)");
      expect(todo.completionDate).toBe("2023-04-01");
      expect(todo.creationDate).toBe("2023-03-15");
      expect(todo.description).toBe("Todo description");
    });

    it("should capture projects and contexts in description", () => {
      const tokens = scanner.scan("Todo with +project and @context tags");
      const parser = new Parser(tokens);
      const todo = parser.parseTodo();

      expect(todo.description).toBe("Todo with +project and @context tags");
      expect(todo.projects).toContain("+project");
      expect(todo.contexts).toContain("@context");
    });

    it("should handle complex date patterns correctly", () => {
      // Test different date positions based on completion status
      const completedTokens = scanner.scan("x 2023-04-01 Todo");
      const completedParser = new Parser(completedTokens);
      const completedTodo = completedParser.parseTodo();

      expect(completedTodo.completed).toBe(true);
      expect(completedTodo.completionDate).toBe("2023-04-01");

      const activeTokens = scanner.scan("2023-04-01 Todo");
      const activeParser = new Parser(activeTokens);
      const activeTodo = activeParser.parseTodo();

      expect(activeTodo.completed).toBe(false);
      expect(activeTodo.creationDate).toBe("2023-04-01");
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed token sequences gracefully", () => {
      // Try some unusual but valid token sequences
      const tokens = scanner.scan(
        "x x x x @context1 @context2 +project1 +project2"
      );
      const parser = new Parser(tokens);

      const todo = parser.parseTodo();
      expect(todo.completed).toBe(true);
      expect(todo.contexts).toHaveLength(2);
      expect(todo.projects).toHaveLength(2);
    });
  });
});
