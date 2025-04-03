import { describe, it, expect, beforeEach } from "@jest/globals";
import { Scanner } from "../src/Scanner";
import { TokenType } from "../src/Token";

describe("Scanner Features", () => {
  let scanner: Scanner;

  beforeEach(() => {
    scanner = new Scanner();
  });

  describe("Basic Tokenization", () => {
    it("should tokenize a simple task", () => {
      const tokens = scanner.scan("Simple task description");
      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe(TokenType.WORD);
      expect(tokens[0].value).toBe("Simple");
      expect(tokens[1].type).toBe(TokenType.WORD);
      expect(tokens[1].value).toBe("task");
      expect(tokens[2].type).toBe(TokenType.WORD);
      expect(tokens[2].value).toBe("description");
    });

    it("should tokenize a completed task", () => {
      const tokens = scanner.scan("x 2023-04-01 Completed task");
      expect(tokens).toHaveLength(4);
      expect(tokens[0].type).toBe(TokenType.COMPLETION);
      expect(tokens[0].value).toBe("x");
      expect(tokens[1].type).toBe(TokenType.DATE);
      expect(tokens[1].value).toBe("2023-04-01");
    });

    it("should tokenize a task with priority", () => {
      const tokens = scanner.scan("(A) High priority task");
      expect(tokens).toHaveLength(4);
      expect(tokens[0].type).toBe(TokenType.PRIORITY);
      expect(tokens[0].value).toBe("(A)");
    });

    it("should tokenize a complete task with all elements", () => {
      const tokens = scanner.scan(
        "x (A) 2023-04-01 2023-03-15 Task +project @context due:2023-05-01"
      );
      expect(tokens).toHaveLength(9);
      expect(tokens[0].type).toBe(TokenType.COMPLETION);
      expect(tokens[1].type).toBe(TokenType.PRIORITY);
      expect(tokens[2].type).toBe(TokenType.DATE);
      expect(tokens[3].type).toBe(TokenType.DATE);
      expect(tokens[4].type).toBe(TokenType.WORD);
      expect(tokens[5].type).toBe(TokenType.PROJECT);
      expect(tokens[6].type).toBe(TokenType.CONTEXT);
      expect(tokens[7].type).toBe(TokenType.KEY);
      expect(tokens[8].type).toBe(TokenType.DATE);
    });
  });

  describe("Special Token Recognition", () => {
    it("should recognize priority tokens only in valid positions", () => {
      // Valid position - at start
      let tokens = scanner.scan("(A) Task");
      expect(tokens[0].type).toBe(TokenType.PRIORITY);

      // Valid position - after completion
      tokens = scanner.scan("x (A) Task");
      expect(tokens[1].type).toBe(TokenType.PRIORITY);

      // Invalid position - in middle (should be WORD)
      tokens = scanner.scan("Task (A) description");
      expect(tokens[1].type).toBe(TokenType.WORD);
    });

    it("should recognize projects and contexts", () => {
      const tokens = scanner.scan("+project @context +another @tag");
      expect(tokens).toHaveLength(4);
      expect(tokens[0].type).toBe(TokenType.PROJECT);
      expect(tokens[1].type).toBe(TokenType.CONTEXT);
      expect(tokens[2].type).toBe(TokenType.PROJECT);
      expect(tokens[3].type).toBe(TokenType.CONTEXT);
    });

    it("should recognize dates", () => {
      const tokens = scanner.scan("2023-04-01 not-a-date 2023-13-01");
      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe(TokenType.DATE);
      expect(tokens[1].type).toBe(TokenType.WORD);
      // Invalid date should still be recognized by pattern
      expect(tokens[2].type).toBe(TokenType.DATE);
    });

    it("should handle key-value pairs", () => {
      const tokens = scanner.scan("due:2023-04-01 priority:high");
      expect(tokens).toHaveLength(4);
      expect(tokens[0].type).toBe(TokenType.KEY);
      expect(tokens[0].value).toBe("due:");
      expect(tokens[1].type).toBe(TokenType.DATE);
      expect(tokens[2].type).toBe(TokenType.KEY);
      expect(tokens[2].value).toBe("priority:");
      expect(tokens[3].type).toBe(TokenType.WORD);
    });

    it("should handle combined key-value tokens", () => {
      const tokens = scanner.scan("key:value another:item");
      expect(tokens).toHaveLength(4);
      expect(tokens[0].type).toBe(TokenType.KEY);
      expect(tokens[1].type).toBe(TokenType.WORD);
      expect(tokens[2].type).toBe(TokenType.KEY);
      expect(tokens[3].type).toBe(TokenType.WORD);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty input", () => {
      const tokens = scanner.scan("");
      expect(tokens).toHaveLength(0);
    });

    it("should handle whitespace-only input", () => {
      const tokens = scanner.scan("   \t   ");
      expect(tokens).toHaveLength(0);
    });

    it("should handle special characters", () => {
      const tokens = scanner.scan("Task! with $pecial #characters");
      expect(tokens).toHaveLength(4);
      expect(tokens[0].value).toBe("Task!");
      expect(tokens[1].value).toBe("with");
      expect(tokens[2].value).toBe("$pecial");
      expect(tokens[3].value).toBe("#characters");
    });
  });
});
