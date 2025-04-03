import { describe, it, expect, beforeEach } from "@jest/globals";
import { Scanner } from "../src/Scanner";
import { TokenType } from "../src/Token";

describe("Scanner Features", () => {
  let scanner: Scanner;

  beforeEach(() => {
    scanner = new Scanner();
  });

  describe("Special Character Handling", () => {
    it("should handle todos with special characters", () => {
      const line = "Todo with special chars: !@#$%^&*()_+-=[]{}|;':,./<>?";
      const tokens = scanner.scan(line);

      expect(tokens.length).toBeGreaterThan(4);
      expect(tokens[0].type).toBe(TokenType.WORD);
      expect(tokens[0].value).toBe("Todo");
    });

    it("should handle non-ASCII characters", () => {
      const line = "Tâche avec des caractères accentués éèêë";
      const tokens = scanner.scan(line);

      expect(tokens.length).toBeGreaterThan(4);
      expect(tokens[0].value).toBe("Tâche");
    });

    it("should handle emojis and unicode", () => {
      const line = "Todo with emojis 😀 📅 👨‍👩‍👧‍👦";
      const tokens = scanner.scan(line);

      expect(tokens.length).toBeGreaterThan(3);
      expect(tokens[0].value).toBe("Todo");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty strings", () => {
      const tokens = scanner.scan("");
      expect(tokens).toHaveLength(0);
    });

    it("should handle strings with only whitespace", () => {
      const tokens = scanner.scan("    \t    ");
      expect(tokens).toHaveLength(0);
    });

    it("should handle very long strings", () => {
      const longDescription = "A".repeat(1000);
      const line = `(A) ${longDescription}`;

      const tokens = scanner.scan(line);
      expect(tokens).toHaveLength(2);
      expect(tokens[0].type).toBe(TokenType.PRIORITY);
      expect(tokens[1].value).toBe(longDescription);
    });
  });

  describe("Token Type Recognition", () => {
    it("should recognize all token types in a complex todo", () => {
      const line =
        "x (A) 2023-04-01 2023-03-15 Call mom +Family @Phone due:2023-05-01 tag:value";
      const tokens = scanner.scan(line);

      const tokenTypeMap = tokens.reduce((map, token) => {
        if (!map[token.type]) {
          map[token.type] = [];
        }
        map[token.type].push(token.value);
        return map;
      }, {} as Record<number, string[]>);

      expect(tokenTypeMap[TokenType.COMPLETION]).toEqual(["x"]);
      expect(tokenTypeMap[TokenType.PRIORITY]).toEqual(["(A)"]);
      expect(tokenTypeMap[TokenType.DATE]).toEqual([
        "2023-04-01",
        "2023-03-15",
        "2023-05-01",
      ]);
      expect(tokenTypeMap[TokenType.PROJECT]).toEqual(["+Family"]);
      expect(tokenTypeMap[TokenType.CONTEXT]).toEqual(["@Phone"]);
      expect(tokenTypeMap[TokenType.KEY]).toEqual(["due:", "tag:"]);
    });

    it("should handle priority in different positions", () => {
      // Priority at start
      const tokens1 = scanner.scan("(A) Todo");
      expect(tokens1[0].type).toBe(TokenType.PRIORITY);

      // Priority after completion
      const tokens2 = scanner.scan("x (A) Todo");
      expect(tokens2[1].type).toBe(TokenType.PRIORITY);

      // Priority in middle (should be a word)
      const tokens3 = scanner.scan("Todo (A) next");
      const priorityTokens = tokens3.filter(
        (t) => t.type === TokenType.PRIORITY
      );
      expect(priorityTokens).toHaveLength(0);
    });

    it("should handle mixed token types", () => {
      const line =
        "@context1 Call +project1 mom @context2 (A) +project2 2023-04-01";
      const tokens = scanner.scan(line);

      // (A) is not at a valid position so should be a WORD
      const priorityTokens = tokens.filter(
        (t) => t.type === TokenType.PRIORITY
      );
      expect(priorityTokens).toHaveLength(0);

      const projectTokens = tokens.filter((t) => t.type === TokenType.PROJECT);
      expect(projectTokens).toHaveLength(2);

      const contextTokens = tokens.filter((t) => t.type === TokenType.CONTEXT);
      expect(contextTokens).toHaveLength(2);

      const dateTokens = tokens.filter((t) => t.type === TokenType.DATE);
      expect(dateTokens).toHaveLength(1);
    });
  });

  describe("Key-Value Processing", () => {
    it("should handle key-value pairs with various value types", () => {
      const line = "Todo num:123 str:abc bool:true date:2023-04-01";
      const tokens = scanner.scan(line);

      // Should have 9 tokens: 1 word + 4 pairs * (1 key + 1 value) = 9
      expect(tokens).toHaveLength(9);

      const keyTokens = tokens.filter((t) => t.type === TokenType.KEY);
      expect(keyTokens).toHaveLength(4);
      expect(keyTokens.map((t) => t.value)).toEqual([
        "num:",
        "str:",
        "bool:",
        "date:",
      ]);

      // The date should be recognized as a DATE token
      expect(tokens[8].type).toBe(TokenType.DATE);
      expect(tokens[8].value).toBe("2023-04-01");
    });

    it("should handle key-value pairs with spaces", () => {
      const line = "Todo key: value";
      const tokens = scanner.scan(line);

      expect(tokens).toHaveLength(3);
      expect(tokens[1].type).toBe(TokenType.KEY);
      expect(tokens[1].value).toBe("key:");
      expect(tokens[2].type).toBe(TokenType.WORD);
      expect(tokens[2].value).toBe("value");
    });

    it("should handle combined key-value pairs", () => {
      const line = "Todo due:2023-04-01";
      const tokens = scanner.scan(line);

      expect(tokens).toHaveLength(3);
      expect(tokens[1].type).toBe(TokenType.KEY);
      expect(tokens[1].value).toBe("due:");
      expect(tokens[2].type).toBe(TokenType.DATE);
      expect(tokens[2].value).toBe("2023-04-01");
    });
  });
});
