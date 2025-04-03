import { describe, it, expect, beforeEach } from "@jest/globals";
import { TodoList, Todo } from "../src/index";

describe("TodoList Enhanced Features", () => {
  let todoList: TodoList;
  const TODAY = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  beforeEach(() => {
    todoList = new TodoList();

    // Ensure past dates for "overdue" tests are actually in the past
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1); // One year ago
    const pastDateString = pastDate.toISOString().split("T")[0];

    // Ensure future dates are actually in the future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
    const futureDateString = futureDate.toISOString().split("T")[0];

    // Add sample todos with reliable dates
    const todo1 = new Todo({
      priority: "A",
      description: "High priority todo",
      contexts: ["@work"],
      projects: ["+project1"],
      keyValues: { due: TODAY },
    });
    todoList.addTodo(todo1);

    const todo2 = new Todo({
      priority: "B",
      description: "Medium priority todo",
      contexts: ["@home"],
      projects: ["+project1", "+project2"],
      keyValues: { due: futureDateString },
    });
    todoList.addTodo(todo2);

    const todo3 = new Todo({
      priority: "C",
      description: "Low priority todo overdue",
      contexts: ["@work"],
      projects: ["+project2"],
      keyValues: { due: pastDateString },
    });
    todoList.addTodo(todo3);

    const completedTodo = new Todo({
      description: "Completed todo",
      contexts: ["@home"],
      projects: ["+project3"],
    });
    completedTodo.markCompleted("2023-03-01");
    todoList.addTodo(completedTodo);
  });

  describe("Getting Todos by Line Number", () => {
    it("should return todo at specific line number", () => {
      const todo = todoList.getTodoByLineNumber(1);
      expect(todo).toBeDefined();
      expect(todo?.description).toBe("Medium priority todo");
    });

    it("should return undefined for out of bounds line numbers", () => {
      expect(todoList.getTodoByLineNumber(-1)).toBeUndefined();
      expect(todoList.getTodoByLineNumber(10)).toBeUndefined();
    });
  });

  describe("Getting Metadata Collections", () => {
    it("should get all unique projects", () => {
      const projects = todoList.getProjects();
      expect(projects).toHaveLength(3);
      expect(projects).toContain("+project1");
      expect(projects).toContain("+project2");
      expect(projects).toContain("+project3");
    });

    it("should get all unique contexts", () => {
      const contexts = todoList.getContexts();
      expect(contexts).toHaveLength(2);
      expect(contexts).toContain("@work");
      expect(contexts).toContain("@home");
    });

    it("should get all unique key names", () => {
      const keyNames = todoList.getKeyNames();
      expect(keyNames).toHaveLength(1);
      expect(keyNames).toContain("due");
    });
  });

  describe("Filtering Todos", () => {
    it("should filter todos by multiple criteria", () => {
      const filteredTodos = todoList.filter({
        completed: false,
        project: "+project1",
        context: "@work",
      });

      expect(filteredTodos).toHaveLength(1);
      expect(filteredTodos[0].description).toBe("High priority todo");
    });

    it("should filter by date ranges", () => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 60); // 60 days in future

      const futureTodos = todoList.filter({
        dueBefore: futureDate.toISOString().split("T")[0],
        dueAfter: today.toISOString().split("T")[0],
      });

      // Should include todo due today and future todos
      expect(futureTodos.length).toBeGreaterThanOrEqual(1);
      expect(
        futureTodos.some(
          (t) =>
            t.description === "High priority todo" ||
            t.description === "Medium priority todo"
        )
      ).toBe(true);
    });
  });

  describe("Sorting Todos", () => {
    it("should sort by priority", () => {
      todoList.sortBy("priority");
      const todos = todoList.getTodos();

      // Find the first todo with priority A - should be first after sorting
      const todoAPriority = todos.find((t) => t.priority === "(A)");
      const todoBPriority = todos.find((t) => t.priority === "(B)");
      const todoCPriority = todos.find((t) => t.priority === "(C)");

      // Check that todos with priorities are sorted correctly
      expect(todos.indexOf(todoAPriority!)).toBeLessThan(
        todos.indexOf(todoBPriority!)
      );
      expect(todos.indexOf(todoBPriority!)).toBeLessThan(
        todos.indexOf(todoCPriority!)
      );
    });

    it("should sort by completion date", () => {
      todoList.sortBy("completion");
      const todos = todoList.getTodos();
      const completedTodos = todos.filter((t) => t.completed);
      expect(completedTodos.length).toBeGreaterThan(0);
      expect(completedTodos[0].description).toBe("Completed todo");
    });
  });

  describe("Todo Queries", () => {
    it("should get todos by context", () => {
      const workTodos = todoList.getTodosByContext("@work");
      expect(workTodos).toHaveLength(2);
      expect(workTodos.every((t) => t.contexts.includes("@work"))).toBe(true);
    });

    it("should get todos by project", () => {
      const project2Todos = todoList.getTodosByProject("+project2");
      expect(project2Todos).toHaveLength(2);
      expect(project2Todos.every((t) => t.projects.includes("+project2"))).toBe(
        true
      );
    });

    it("should get todos by property", () => {
      const priorityATodos = todoList.getTodosByProperty("priority", "(A)");
      expect(priorityATodos).toHaveLength(1);
      expect(priorityATodos[0].description).toBe("High priority todo");
    });

    it("should get todos by key-value pair", () => {
      const todayTodos = todoList.getTodosByKeyValue("due", TODAY);
      expect(todayTodos.length).toBeGreaterThan(0);
      expect(todayTodos[0].description).toBe("High priority todo");
    });
  });

  describe("Date-Based Queries", () => {
    it("should get due today todos", () => {
      const todayTodos = todoList.getDueTodayTodos();
      expect(todayTodos.length).toBeGreaterThan(0);
      expect(todayTodos[0].keyValues.due).toBe(TODAY);
    });

    it("should get overdue todos", () => {
      const overdueTodos = todoList.getOverdueTodos();
      expect(overdueTodos.length).toBeGreaterThan(0);

      // Find the todo that has "Low priority todo overdue" in the description
      const lowPriorityTodo = overdueTodos.find(
        (t) => t.description === "Low priority todo overdue"
      );
      expect(lowPriorityTodo).toBeDefined();
    });

    it("should get todos due in next N days", () => {
      const dueSoonTodos = todoList.getDueInNextNDaysTodos(365);
      expect(dueSoonTodos.length).toBeGreaterThan(1);

      // The todo due today and the future todo should be included
      expect(
        dueSoonTodos.some((t) => t.description === "High priority todo")
      ).toBe(true);
      expect(
        dueSoonTodos.some((t) => t.description === "Medium priority todo")
      ).toBe(true);
    });
  });

  describe("Todo Operations", () => {
    it("should add a todo with string parsing", () => {
      todoList.addTodo(
        "(D) New todo from string @stringContext +stringProject"
      );
      const lastTodo = todoList.getTodos()[todoList.getTodos().length - 1];

      expect(lastTodo.priority).toBe("(D)");
      expect(lastTodo.description).toContain("New todo from string");
      expect(lastTodo.contexts).toContain("@stringContext");
      expect(lastTodo.projects).toContain("+stringProject");
    });

    it("should edit a todo with an updater function", () => {
      const todoToEdit = todoList.getTodos()[0];
      todoList.editTodo(todoToEdit.id, (todo) => {
        todo.setDescription("Updated description");
        todo.setPriority("Z");
      });

      const updatedTodo = todoList.getTodo(todoToEdit.id);
      expect(updatedTodo?.description).toBe("Updated description");
      expect(updatedTodo?.priority).toBe("(Z)");
    });

    it("should replace a todo", () => {
      const originalTodo = todoList.getTodos()[0];
      const replacementTodo = new Todo({
        description: "Replacement todo",
        priority: originalTodo.priority,
      });

      // Important: Use the same ID to ensure replacement works
      replacementTodo.id = originalTodo.id;

      todoList.editTodo(replacementTodo);

      const updatedTodo = todoList.getTodo(originalTodo.id);
      expect(updatedTodo?.description).toBe("Replacement todo");
    });

    it("should delete a todo by id", () => {
      const originalCount = todoList.getTodos().length;
      const todoToDelete = todoList.getTodos()[0];

      todoList.deleteTodo(todoToDelete.id);

      expect(todoList.getTodos().length).toBe(originalCount - 1);
      expect(todoList.getTodo(todoToDelete.id)).toBeUndefined();
    });

    it("should delete a todo by object", () => {
      const originalCount = todoList.getTodos().length;
      const todoToDelete = todoList.getTodos()[0];

      todoList.deleteTodo(todoToDelete);

      expect(todoList.getTodos().length).toBe(originalCount - 1);
      expect(todoList.getTodo(todoToDelete.id)).toBeUndefined();
    });
  });

  describe("String Conversion", () => {
    it("should convert todo list to string format", () => {
      const str = todoList.toString();
      const lines = str.split("\n");

      expect(lines.length).toBe(4); // 4 todos
      expect(lines.some((line) => line.includes("(A)"))).toBe(true);
      expect(lines.some((line) => line.includes("High priority todo"))).toBe(
        true
      );

      expect(lines.some((line) => line.includes("x 2023-03-01"))).toBe(true);
      expect(lines.some((line) => line.includes("Completed todo"))).toBe(true);
    });
  });
});
