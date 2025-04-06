import { describe, it, expect, beforeEach } from "@jest/globals";
import { Todo, RecurrencePattern } from "../src/Todo";

describe("Todo Features", () => {
  let todo: Todo;
  const TODAY = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  beforeEach(() => {
    todo = new Todo({
      description: "Test todo",
      priority: "B",
    });
  });

  describe("Constructor", () => {
    it("should create a todo with default values", () => {
      const simpleTodo = new Todo();
      expect(simpleTodo.id).toBeDefined();
      expect(simpleTodo.completed).toBe(false);
      expect(simpleTodo.description).toBe("");
      expect(simpleTodo.projects).toEqual([]);
      expect(simpleTodo.contexts).toEqual([]);
      expect(simpleTodo.keyValues).toEqual({});
    });

    it("should create a todo with provided values", () => {
      const fullTodo = new Todo({
        completed: true,
        priority: "A",
        completionDate: "2023-03-01",
        creationDate: "2023-02-15",
        description: "Complete project",
        projects: ["+Work"],
        contexts: ["@computer"],
        keyValues: { due: "2023-03-30", difficulty: "high" },
      });

      expect(fullTodo.completed).toBe(true);
      expect(fullTodo.priority).toBe("(A)");
      expect(fullTodo.completionDate).toBe("2023-03-01");
      expect(fullTodo.creationDate).toBe("2023-02-15");
      expect(fullTodo.description).toBe("Complete project");
      expect(fullTodo.projects).toEqual(["+Work"]);
      expect(fullTodo.contexts).toEqual(["@computer"]);
      expect(fullTodo.keyValues).toEqual({
        due: "2023-03-30",
        difficulty: "high",
      });
    });

    it("should handle convenience parameters", () => {
      const todo = new Todo({
        description: "Call Mom",
        priority: "A",
        contexts: ["phone"],
        projects: ["Family"],
        due: "2023-04-05",
      });

      expect(todo.priority).toBe("(A)");
      expect(todo.contexts).toContain("@phone");
      expect(todo.projects).toContain("+Family");
      expect(todo.keyValues.due).toBe("2023-04-05");
    });

    it("should handle incorrectly formatted priorities", () => {
      const todo1 = new Todo({ priority: "a" });
      expect(todo1.priority).toBe("(A)");

      const todo2 = new Todo({ priority: "(X)" });
      expect(todo2.priority).toBe("(X)");

      const todo3 = new Todo({ priority: "X" });
      expect(todo3.priority).toBe("(X)");
    });
  });

  describe("Description Management", () => {
    it("should set description", () => {
      todo.setDescription("New description");
      expect(todo.description).toBe("New description");
    });
  });

  describe("Due Date Handling", () => {
    it("should set and get due date", () => {
      todo.setDueDate("2023-05-01");
      expect(todo.getDueDate()).toBe("2023-05-01");
    });

    it("should correctly identify todos due today", () => {
      todo.setDueDate(TODAY);
      expect(todo.isDueToday()).toBe(true);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      todo.setDueDate(tomorrow.toISOString().split("T")[0]);
      expect(todo.isDueToday()).toBe(false);
    });

    it("should correctly identify overdue todos", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      todo.setDueDate(yesterday.toISOString().split("T")[0]);
      expect(todo.isOverdue()).toBe(true);

      todo.setDueDate(TODAY);
      expect(todo.isOverdue()).toBe(false);

      // Completed todos are not overdue
      todo.setDueDate(yesterday.toISOString().split("T")[0]);
      todo.markCompleted();
      expect(todo.isOverdue()).toBe(false);
    });

    it("should calculate days until due", () => {
      const futureDateObj = new Date();
      futureDateObj.setDate(futureDateObj.getDate() + 3);
      const futureDate = futureDateObj.toISOString().split("T")[0];

      todo.setDueDate(futureDate);
      expect(todo.daysUntilDue()).toBe(3);

      const pastDateObj = new Date();
      pastDateObj.setDate(pastDateObj.getDate() - 2);
      const pastDate = pastDateObj.toISOString().split("T")[0];

      todo.setDueDate(pastDate);
      expect(todo.daysUntilDue()).toBe(-2);
    });
  });

  describe("Completion Status", () => {
    it("should mark todo as completed with date", () => {
      todo.markCompleted("2023-04-01");
      expect(todo.completed).toBe(true);
      expect(todo.completionDate).toBe("2023-04-01");
    });

    it("should use today's date when no completion date is provided", () => {
      todo.markCompleted();
      expect(todo.completed).toBe(true);
      expect(todo.completionDate).toBe(TODAY);
    });

    it("should mark todo as incomplete and clear completion date", () => {
      todo.markCompleted("2023-04-01");
      todo.markIncomplete();
      expect(todo.completed).toBe(false);
      expect(todo.completionDate).toBeUndefined();
    });

    it("should toggle completion status", () => {
      expect(todo.completed).toBe(false);

      const result1 = todo.toggleCompletion();
      expect(todo.completed).toBe(true);
      expect(result1).toBe(true);
      expect(todo.completionDate).toBeDefined();

      const result2 = todo.toggleCompletion();
      expect(todo.completed).toBe(false);
      expect(result2).toBe(false);
      expect(todo.completionDate).toBeUndefined();
    });
  });

  describe("Context Management", () => {
    it("should add contexts with @ symbol", () => {
      todo.addContext("work");
      expect(todo.contexts).toContain("@work");
    });

    it("should add contexts with @ symbol already included", () => {
      todo.addContext("@home");
      expect(todo.contexts).toContain("@home");
    });

    it("should not add duplicate contexts", () => {
      todo.addContext("work");
      todo.addContext("@work");
      expect(todo.contexts.length).toBe(1);
      expect(todo.contexts).toContain("@work");
    });

    it("should remove contexts", () => {
      todo.addContext("work");
      todo.addContext("home");
      expect(todo.contexts.length).toBe(2);

      todo.removeContext("work");
      expect(todo.contexts.length).toBe(1);
      expect(todo.contexts).not.toContain("@work");
      expect(todo.contexts).toContain("@home");
    });
  });

  describe("Project Management", () => {
    it("should add projects with + symbol", () => {
      todo.addProject("personal");
      expect(todo.projects).toContain("+personal");
    });

    it("should add projects with + symbol already included", () => {
      todo.addProject("+work");
      expect(todo.projects).toContain("+work");
    });

    it("should not add duplicate projects", () => {
      todo.addProject("work");
      todo.addProject("+work");
      expect(todo.projects.length).toBe(1);
      expect(todo.projects).toContain("+work");
    });

    it("should remove projects", () => {
      todo.addProject("work");
      todo.addProject("home");
      expect(todo.projects.length).toBe(2);

      todo.removeProject("work");
      expect(todo.projects.length).toBe(1);
      expect(todo.projects).not.toContain("+work");
      expect(todo.projects).toContain("+home");
    });
  });

  describe("Priority Management", () => {
    it("should set priority correctly", () => {
      todo.setPriority("A");
      expect(todo.priority).toBe("(A)");

      todo.setPriority("(C)");
      expect(todo.priority).toBe("(C)");

      todo.setPriority(null);
      expect(todo.priority).toBeUndefined();
    });

    it("should increase priority", () => {
      todo.setPriority("C");
      expect(todo.priority).toBe("(C)");

      todo.increasePriority();
      expect(todo.priority).toBe("(B)");

      todo.increasePriority();
      expect(todo.priority).toBe("(A)");

      // No change when already at A
      todo.increasePriority();
      expect(todo.priority).toBe("(A)");
    });

    it("should set priority to Z when increasing from none", () => {
      todo.setPriority(null);
      expect(todo.priority).toBeUndefined();

      todo.increasePriority();
      expect(todo.priority).toBe("(Z)");
    });

    it("should decrease priority", () => {
      todo.setPriority("A");
      expect(todo.priority).toBe("(A)");

      todo.decreasePriority();
      expect(todo.priority).toBe("(B)");

      // Skip to Z
      todo.setPriority("Z");
      todo.decreasePriority();
      expect(todo.priority).toBeUndefined();
    });
  });

  describe("Key-Value Management", () => {
    it("should set and get key-value pairs", () => {
      todo.setKeyValue("difficulty", "hard");
      expect(todo.keyValues["difficulty"]).toBe("hard");

      todo.setKeyValue("estimate", 2.5);
      expect(todo.keyValues["estimate"]).toBe(2.5);
    });

    it("should remove key-value pairs", () => {
      todo.setKeyValue("difficulty", "hard");
      todo.setKeyValue("estimate", 2.5);

      todo.removeKeyValue("difficulty");
      expect(todo.keyValues["difficulty"]).toBeUndefined();
      expect(todo.keyValues["estimate"]).toBe(2.5);
    });
  });

  describe("Recurrence", () => {
    it("should set recurrence pattern", () => {
      todo.setRecurrence({ type: "weekly", interval: 2 });
      expect(todo.keyValues["rec"]).toBe("2w");
    });

    it("should get recurrence pattern", () => {
      todo.setKeyValue("rec", "3d");
      const pattern = todo.getRecurrence();
      expect(pattern).toEqual({ type: "daily", interval: 3 });

      todo.setKeyValue("rec", "1m");
      expect(todo.getRecurrence()).toEqual({ type: "monthly", interval: 1 });

      todo.setKeyValue("rec", "5y");
      expect(todo.getRecurrence()).toEqual({ type: "yearly", interval: 5 });
    });

    it("should return undefined for invalid recurrence patterns", () => {
      todo.setKeyValue("rec", "invalid");
      expect(todo.getRecurrence()).toBeUndefined();

      todo.setKeyValue("rec", "5x"); // Invalid type
      expect(todo.getRecurrence()).toBeUndefined();
    });

    it("should generate recurring todo with correct due date", () => {
      todo.setDueDate("2023-04-10");
      todo.setRecurrence({ type: "weekly", interval: 2 });

      const newTodo = todo.generateRecurringTodo();
      expect(newTodo).toBeDefined();
      expect(newTodo?.getDueDate()).toBe("2023-04-24"); // 2 weeks later

      // Should preserve other properties
      expect(newTodo?.description).toBe(todo.description);
      expect(newTodo?.priority).toBe(todo.priority);
    });

    it("should not generate recurring todo without due date", () => {
      todo.setRecurrence({ type: "weekly", interval: 2 });
      const newTodo = todo.generateRecurringTodo();
      expect(newTodo).toBeUndefined();
    });

    it("should not generate recurring todo without recurrence pattern", () => {
      todo.setDueDate("2023-04-10");
      const newTodo = todo.generateRecurringTodo();
      expect(newTodo).toBeUndefined();
    });
  });

  describe("String Representation", () => {
    it("should convert todo to correct string format", () => {
      todo = new Todo({
        description: "Test todo",
        priority: "A",
        projects: ["+project"],
        contexts: ["@context"],
        keyValues: { due: "2023-04-10" },
      });

      const str = todo.toString();
      expect(str).toBe("(A) Test todo +project @context due:2023-04-10");

      // Completed todo
      todo.markCompleted("2023-04-01");
      todo.creationDate = "2023-03-15";
      const completedStr = todo.toString();
      expect(completedStr).toBe(
        "x 2023-04-01 2023-03-15 Test todo +project @context due:2023-04-10"
      );
    });
  });

  describe("Todo Cloning", () => {
    it("should create a deep copy of the todo", () => {
      todo = new Todo({
        description: "Original todo",
        priority: "A",
        projects: ["+project"],
        contexts: ["@context"],
        keyValues: { due: "2023-04-10" },
      });

      const clone = todo.clone();

      // Verify all properties match
      expect(clone.description).toBe(todo.description);
      expect(clone.priority).toBe(todo.priority);
      expect(clone.projects).toEqual(todo.projects);
      expect(clone.contexts).toEqual(todo.contexts);
      expect(clone.keyValues).toEqual(todo.keyValues);

      // Verify it's a different object
      expect(clone).not.toBe(todo);
      expect(clone.id).not.toBe(todo.id);

      // Verify it's a deep copy (modifying one doesn't affect the other)
      clone.setDescription("Modified todo");
      clone.addProject("+newproject");
      clone.setDueDate("2023-05-01");

      expect(todo.description).toBe("Original todo");
      expect(todo.projects).not.toContain("+newproject");
      expect(todo.keyValues.due).toBe("2023-04-10");
    });
  });
});
