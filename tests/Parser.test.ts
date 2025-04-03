import { describe, it, expect, beforeEach } from "@jest/globals";
import { Scanner } from "../src/Scanner";
import { Parser, ParserOptions, KeyHandler } from "../src/Parser";
import { TaskParsingError } from "../src/TaskParsingError";
import { Token, TokenType } from "../src/Token";

describe("Parser Advanced Features", () => {
  let scanner: Scanner;

  beforeEach(() => {
    scanner = new Scanner();
  });

  describe("Parser Options", () => {
    describe("Duplicate Key Behavior", () => {
      const taskWithDuplicateKeys =
        "(A) Test task due:2023-04-01 due:2023-05-01";

      it("should throw error for duplicate keys with 'error' behavior", () => {
        const tokens = scanner.scan(taskWithDuplicateKeys);
        const parser = new Parser(tokens, { duplicateKeyBehavior: "error" });

        expect(() => parser.parseTask()).toThrow(TaskParsingError);
        expect(() => parser.parseTask()).toThrow(/Duplicate key/);
      });

      it("should overwrite values with 'overwrite' behavior", () => {
        const tokens = scanner.scan(taskWithDuplicateKeys);
        const parser = new Parser(tokens, {
          duplicateKeyBehavior: "overwrite",
        });

        const task = parser.parseTask();
        expect(task.keyValues["due"]).toBe("2023-05-01");
      });

      it("should merge values into array with 'merge' behavior", () => {
        const tokens = scanner.scan(taskWithDuplicateKeys);
        const parser = new Parser(tokens, { duplicateKeyBehavior: "merge" });

        const task = parser.parseTask();
        expect(Array.isArray(task.keyValues["due"])).toBe(true);
        expect(task.keyValues["due"]).toEqual(["2023-04-01", "2023-05-01"]);
      });
    });

    describe("Custom Key Handlers", () => {
      it("should validate keys using custom handler", () => {
        const keyHandler: KeyHandler = {
          key: "due",
          validate: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value),
        };

        // Valid date should parse successfully
        const validTokens = scanner.scan("Task due:2023-04-01");
        const validParser = new Parser(validTokens, {
          customKeyHandlers: [keyHandler],
        });
        expect(() => validParser.parseTask()).not.toThrow();

        // Invalid date should throw validation error
        const invalidTokens = scanner.scan("Task due:01-04-2023");
        const invalidParser = new Parser(invalidTokens, {
          customKeyHandlers: [keyHandler],
        });
        expect(() => invalidParser.parseTask()).toThrow(TaskParsingError);
        expect(() => invalidParser.parseTask()).toThrow(/Validation failed/);
      });

      it("should transform values using custom handler", () => {
        const keyHandler: KeyHandler = {
          key: "priority",
          transform: (value) => parseInt(value),
        };

        const tokens = scanner.scan("Task priority:5");
        const parser = new Parser(tokens, { customKeyHandlers: [keyHandler] });

        const task = parser.parseTask();
        expect(typeof task.keyValues["priority"]).toBe("number");
        expect(task.keyValues["priority"]).toBe(5);
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

        const tokens = scanner.scan("Task due:2023-04-01 priority:5");
        const parser = new Parser(tokens, { customKeyHandlers: handlers });

        const task = parser.parseTask();
        expect(task.keyValues["due"] instanceof Date).toBe(true);
        expect(task.keyValues["due"].getFullYear()).toBe(2023);
        expect(typeof task.keyValues["priority"]).toBe("number");
        expect(task.keyValues["priority"]).toBe(5);
      });
    });
  });

  describe("Token Processing", () => {
    it("should handle empty token arrays", () => {
      const parser = new Parser([], {});
      const task = parser.parseTask();

      expect(task).toBeDefined();
      expect(task.description).toBe("");
    });

    it("should correctly assign completion date and creation date", () => {
      // x (A) 2023-04-01 2023-03-15 Task description
      const tokens = [
        new Token(TokenType.COMPLETION, "x"),
        new Token(TokenType.PRIORITY, "(A)"),
        new Token(TokenType.DATE, "2023-04-01"),
        new Token(TokenType.DATE, "2023-03-15"),
        new Token(TokenType.WORD, "Task"),
        new Token(TokenType.WORD, "description"),
      ];

      const parser = new Parser(tokens);
      const task = parser.parseTask();

      expect(task.completed).toBe(true);
      expect(task.priority).toBe("(A)");
      expect(task.completionDate).toBe("2023-04-01");
      expect(task.creationDate).toBe("2023-03-15");
      expect(task.description).toBe("Task description");
    });

    it("should capture projects and contexts in description", () => {
      const tokens = scanner.scan("Task with +project and @context tags");
      const parser = new Parser(tokens);
      const task = parser.parseTask();

      expect(task.description).toBe("Task with +project and @context tags");
      expect(task.projects).toContain("+project");
      expect(task.contexts).toContain("@context");
    });

    it("should handle complex date patterns correctly", () => {
      // Test different date positions based on completion status
      const completedTokens = scanner.scan("x 2023-04-01 Task");
      const completedParser = new Parser(completedTokens);
      const completedTask = completedParser.parseTask();

      expect(completedTask.completed).toBe(true);
      expect(completedTask.completionDate).toBe("2023-04-01");

      const activeTokens = scanner.scan("2023-04-01 Task");
      const activeParser = new Parser(activeTokens);
      const activeTask = activeParser.parseTask();

      expect(activeTask.completed).toBe(false);
      expect(activeTask.creationDate).toBe("2023-04-01");
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed token sequences gracefully", () => {
      // Try some unusual but valid token sequences
      const tokens = scanner.scan(
        "x x x x @context @context +project +project"
      );
      const parser = new Parser(tokens);

      const task = parser.parseTask();
      expect(task.completed).toBe(true);
      expect(task.contexts).toHaveLength(2);
      expect(task.projects).toHaveLength(2);
    });
  });
});
