import { describe, it, expect } from "@jest/globals";

import { Task } from "../src/Task";

describe("Task", () => {
  it("should generate a unique id using crypto.randomUUID", () => {
    const task1 = new Task();
    const task2 = new Task();
    expect(task1.id).not.toBe(task2.id);
    // Check that id is a non-empty string.
    expect(typeof task1.id).toBe("string");
    expect(task1.id.length).toBeGreaterThan(0);
  });

  it("should update description using setDescription", () => {
    const task = new Task({ description: "Initial description" });
    task.setDescription("Updated description");
    expect(task.description).toBe("Updated description");
  });

  it("should update due date using setDueDate", () => {
    const task = new Task();
    task.setDueDate("2021-09-01");
    expect(task.keyValues["due"]).toBe("2021-09-01");
  });

  it("should mark task as completed", () => {
    const task = new Task();
    task.markCompleted("2021-09-02");
    expect(task.completed).toBe(true);
    expect(task.completionDate).toBe("2021-09-02");
  });
});
