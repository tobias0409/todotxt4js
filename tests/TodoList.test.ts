import { describe, it, expect, beforeEach } from "@jest/globals";

import { TodoList } from "../src/TodoList";

describe("TodoList", () => {
  let todoList: TodoList;

  beforeEach(() => {
    todoList = new TodoList();
  });

  it("should parse multiple tasks from a multiline text", () => {
    const text = `(A) Call Mom @phone due:2021-07-01
Post signs around the neighborhood +GarageSale
x 2011-03-03 Call Dad`;
    todoList.parse(text);
    expect(todoList.tasks.length).toBe(3);
    expect(todoList.tasks[0].description).toContain("Call Mom");
    expect(todoList.tasks[0].contexts).toContain("@phone");
    expect(todoList.tasks[0].keyValues["due"]).toBe("2021-07-01");
    expect(todoList.tasks[1].description).toContain("Post signs");
    expect(todoList.tasks[1].projects).toContain("+GarageSale");
    expect(todoList.tasks[2].completed).toBe(true);
    expect(todoList.tasks[2].description).toContain("Call Dad");
  });

  it("should add a new task", () => {
    todoList.addTask("(A) Call Mom @phone due:2021-07-01");
    expect(todoList.tasks.length).toBe(1);
    const task = todoList.tasks[0];
    expect(task.description).toContain("Call Mom");
    expect(task.contexts).toContain("@phone");
    expect(task.keyValues["due"]).toBe("2021-07-01");
  });

  it("should edit an existing task", () => {
    todoList.addTask("(A) Call Mom @phone due:2021-07-01");
    const taskId = todoList.tasks[0].id;
    todoList.editTask(taskId, (task) => {
      task.setDescription("Call Mom and Dad");
      task.setDueDate("2021-08-01");
    });
    const editedTask = todoList.tasks.find((task) => task.id === taskId);
    expect(editedTask).toBeDefined();
    expect(editedTask?.description).toBe("Call Mom and Dad");
    expect(editedTask?.keyValues["due"]).toBe("2021-08-01");
  });

  it("should delete a task", () => {
    todoList.addTask("(A) Call Mom @phone due:2021-07-01");
    todoList.addTask("Post signs around the neighborhood +GarageSale");
    const initialCount = todoList.tasks.length;
    const taskIdToDelete = todoList.tasks[0].id;
    todoList.deleteTask(taskIdToDelete);
    expect(todoList.tasks.length).toBe(initialCount - 1);
    const deletedTask = todoList.tasks.find(
      (task) => task.id === taskIdToDelete
    );
    expect(deletedTask).toBeUndefined();
  });

  it("should throw an error when editing a non-existent task", () => {
    expect(() => {
      todoList.editTask("non-existent-id", (task) => {
        task.setDescription("New description");
      });
    }).toThrowError(/Task with id non-existent-id not found/);
  });

  it("should convert the todo list back to a proper string representation", () => {
    todoList.addTask("(A) Call Mom @phone due:2021-07-01");
    todoList.addTask("Post signs around the neighborhood +GarageSale");
    const output = todoList.toString();
    expect(output).toContain("(A)");
    expect(output).toContain("Call Mom");
    expect(output).toContain("@phone");
    expect(output).toContain("+GarageSale");
    expect(output).toContain("due:2021-07-01");
    const lines = output.split("\n");
    expect(lines.length).toBe(2);
  });
});
