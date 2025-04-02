import { describe, it, expect, beforeEach } from "@jest/globals";

import { Scanner } from "../src/Scanner";
import { TokenType } from "../src/Token";

describe("Scanner", () => {
  let scanner: Scanner;

  beforeEach(() => {
    scanner = new Scanner();
  });

  it("should tokenize a completed task line correctly", () => {
    const line =
      "x (A) 2020-12-31 2020-12-30 Call mom +Family @Phone due:2021-01-01";
    const tokens = scanner.scan(line);
    expect(tokens).toHaveLength(10);
    expect(tokens[0].type).toBe(TokenType.COMPLETION);
    expect(tokens[1].type).toBe(TokenType.PRIORITY);
    expect(tokens[2].type).toBe(TokenType.DATE);
    expect(tokens[3].type).toBe(TokenType.DATE);
    expect(tokens[4].type).toBe(TokenType.WORD);
    expect(tokens[5].type).toBe(TokenType.WORD);
    expect(tokens[6].type).toBe(TokenType.PROJECT);
    expect(tokens[7].type).toBe(TokenType.CONTEXT);
    expect(tokens[8].type).toBe(TokenType.KEY);
    expect(tokens[9].type).toBe(TokenType.DATE);
  });

  it("should fallback to WORD token for unknown patterns", () => {
    const line = "randomword";
    const tokens = scanner.scan(line);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.WORD);
    expect(tokens[0].value).toBe("randomword");
  });

  it("should tokenize key-value pairs correctly", () => {
    const line = "Finish report due:2021-07-01";
    const tokens = scanner.scan(line);
    expect(tokens).toHaveLength(4);
    expect(tokens[2].type).toBe(TokenType.KEY);
    expect(tokens[2].value).toBe("due:");
    expect(tokens[3].type).toBe(TokenType.DATE);
    expect(tokens[3].value).toBe("2021-07-01");
  });

  it("should tokenize multiple projects and contexts", () => {
    const line = "(A) Call Mom +Family +PeaceLoveAndHappiness @iphone @phone";
    const tokens = scanner.scan(line);
    expect(tokens[0].type).toBe(TokenType.PRIORITY);
    expect(tokens[1].value).toBe("Call");
    expect(tokens[2].value).toBe("Mom");
    expect(tokens[3].type).toBe(TokenType.PROJECT);
    expect(tokens[4].type).toBe(TokenType.PROJECT);
    expect(tokens[5].type).toBe(TokenType.CONTEXT);
    expect(tokens[6].type).toBe(TokenType.CONTEXT);
  });

  it("should not tokenize a priority when not at the beginning", () => {
    const line = "Really gotta call Mom (A) @phone @someday";
    const tokens = scanner.scan(line);
    const priorityTokens = tokens.filter((t) => t.type === TokenType.PRIORITY);
    expect(priorityTokens).toHaveLength(0);
  });

  it("should not recognize lowercase or malformed priorities", () => {
    const line1 = "(b) Get back to the boss";
    const tokens1 = scanner.scan(line1);
    const priorityTokens1 = tokens1.filter(
      (t) => t.type === TokenType.PRIORITY
    );
    expect(priorityTokens1).toHaveLength(0);

    const line2 = "(B)->Submit TPS report";
    const tokens2 = scanner.scan(line2);
    const priorityTokens2 = tokens2.filter(
      (t) => t.type === TokenType.PRIORITY
    );
    expect(priorityTokens2).toHaveLength(0);
  });

  it("should handle creation dates at the start", () => {
    const line = "2011-03-02 Document +TodoTxt task format";
    const tokens = scanner.scan(line);
    expect(tokens[0].type).toBe(TokenType.DATE);
    expect(tokens[0].value).toBe("2011-03-02");
  });

  it("should not split tokens if key-value pattern is not met", () => {
    const line = "due: report";
    const tokens = scanner.scan(line);
    expect(tokens).toHaveLength(2);
    expect(tokens[0].type).toBe(TokenType.KEY);
    expect(tokens[1].type).toBe(TokenType.WORD);
  });
});
