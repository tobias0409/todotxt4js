import { describe, it, expect, beforeEach } from "@jest/globals";

import { Scanner } from "../src/Scanner";
import { Parser, ParserOptions, KeyHandler } from "../src/Parser";
import { TaskParsingError } from "../src/TaskParsingError";

describe("Parser", () => {
  let scanner: Scanner;

  beforeEach(() => {
    scanner = new Scanner();
  });

  it("should parse a completed task with priority and dates", () => {
    const line =
      "x (A) 2020-12-31 2020-12-30 Call mom +Family @Phone due:2021-01-01";
    const tokens = scanner.scan(line);
    const parser = new Parser(tokens);
    const task = parser.parseTask();

    expect(task.completed).toBe(true);
    expect(task.priority).toBe("(A)");
    expect(task.completionDate).toBe("2020-12-31");
    expect(task.creationDate).toBe("2020-12-30");
    expect(task.description).toBe("Call mom +Family @Phone");
    expect(task.keyValues["due"]).toBe("2021-01-01");
  });

  it("should parse a non-completed task with creation date and priority", () => {
    const line = "(A) 2011-03-02 Call Mom";
    const tokens = scanner.scan(line);
    const parser = new Parser(tokens);
    const task = parser.parseTask();

    expect(task.completed).toBe(false);
    expect(task.priority).toBe("(A)");
    expect(task.creationDate).toBe("2011-03-02");
    expect(task.description).toBe("Call Mom");
  });

  it("should parse a non-completed task without priority", () => {
    const line = "2011-03-02 Document +TodoTxt task format";
    const tokens = scanner.scan(line);
    const parser = new Parser(tokens);
    const task = parser.parseTask();

    expect(task.completed).toBe(false);
    expect(task.priority).toBeUndefined();
    expect(task.creationDate).toBe("2011-03-02");
    expect(task.description).toBe("Document +TodoTxt task format");
  });

  it("should parse a task with multiple projects and contexts", () => {
    const line = "(A) Call Mom +Family +PeaceLoveAndHappiness @iphone @phone";
    const tokens = scanner.scan(line);
    const parser = new Parser(tokens);
    const task = parser.parseTask();

    expect(task.priority).toBe("(A)");
    expect(task.description).toBe(
      "Call Mom +Family +PeaceLoveAndHappiness @iphone @phone"
    );
  });

  it("should not assign a creation date if the date is not in the correct position", () => {
    const line = "(A) Call Mom 2011-03-02";
    const tokens = scanner.scan(line);
    const parser = new Parser(tokens);
    const task = parser.parseTask();

    expect(task.priority).toBe("(A)");
    expect(task.creationDate).toBeUndefined();
    expect(task.description).toBe("Call Mom 2011-03-02");
  });

  it("should handle a complete task without a creation date", () => {
    const line = "x 2011-03-03 Call Mom";
    const tokens = scanner.scan(line);
    const parser = new Parser(tokens);
    const task = parser.parseTask();

    expect(task.completed).toBe(true);
    expect(task.completionDate).toBe("2011-03-03");
    expect(task.creationDate).toBeUndefined();
    expect(task.description).toBe("Call Mom");
  });

  it("should handle duplicate keys according to behavior", () => {
    const line = "(B) 2021-04-01 Update report status:complete status:pending";
    const tokens = scanner.scan(line);

    // Duplicate key error behavior.
    const errorOptions: ParserOptions = { duplicateKeyBehavior: "error" };
    const parserError = new Parser(tokens, errorOptions);
    expect(() => parserError.parseTask()).toThrow(TaskParsingError);

    // Merge behavior.
    const mergeOptions: ParserOptions = { duplicateKeyBehavior: "merge" };
    const parserMerge = new Parser(tokens, mergeOptions);
    const taskMerge = parserMerge.parseTask();
    expect(Array.isArray(taskMerge.keyValues["status"])).toBe(true);
    expect(taskMerge.keyValues["status"]).toEqual(["complete", "pending"]);

    // Overwrite behavior.
    const overwriteOptions: ParserOptions = {
      duplicateKeyBehavior: "overwrite",
    };
    const parserOverwrite = new Parser(tokens, overwriteOptions);
    const taskOverwrite = parserOverwrite.parseTask();
    expect(taskOverwrite.keyValues["status"]).toBe("pending");
  });

  describe("Custom Key Handlers", () => {
    const dueDateHandler: KeyHandler = {
      key: "due",
      validate: (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value),
      transform: (value: string) => new Date(value),
    };

    it("should use custom key handler to transform the value", () => {
      const line = "Call Mom due:2021-07-01";
      const tokens = scanner.scan(line);
      const options = { customKeyHandlers: [dueDateHandler] };
      const parser = new Parser(tokens, options);
      const task = parser.parseTask();
      expect(task.keyValues["due"]).toBeInstanceOf(Date);
      expect(task.keyValues["due"].getFullYear()).toBe(2021);
    });

    it("should throw an error if custom key validation fails", () => {
      const line = "Call Mom due:07-01-2021";
      const tokens = scanner.scan(line);
      const options = { customKeyHandlers: [dueDateHandler] };
      const parser = new Parser(tokens, options);
      expect(() => parser.parseTask()).toThrow(TaskParsingError);
    });
  });
});
