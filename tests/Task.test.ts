import { describe, it, expect, beforeEach } from "@jest/globals";
import { Task } from "../src/Task";

describe("Task Features", () => {
  let task: Task;
  const TODAY = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  beforeEach(() => {
    task = new Task({
      description: "Test task",
      priority: "B",
    });
  });

  describe("Constructor", () => {
    it("should create a task with default values", () => {
      const simpleTask = new Task();
      expect(simpleTask.id).toBeDefined();
      expect(simpleTask.completed).toBe(false);
      expect(simpleTask.description).toBe("");
      expect(simpleTask.projects).toEqual([]);
      expect(simpleTask.contexts).toEqual([]);
      expect(simpleTask.keyValues).toEqual({});
    });

    it("should create a task with provided values", () => {
      const fullTask = new Task({
        completed: true,
        priority: "A",
        completionDate: "2023-03-01",
        creationDate: "2023-02-15",
        description: "Complete project",
        projects: ["+Work"],
        contexts: ["@computer"],
        keyValues: { due: "2023-03-30", difficulty: "high" },
      });

      expect(fullTask.completed).toBe(true);
      expect(fullTask.priority).toBe("(A)");
      expect(fullTask.completionDate).toBe("2023-03-01");
      expect(fullTask.creationDate).toBe("2023-02-15");
      expect(fullTask.description).toBe("Complete project");
      expect(fullTask.projects).toEqual(["+Work"]);
      expect(fullTask.contexts).toEqual(["@computer"]);
      expect(fullTask.keyValues).toEqual({
        due: "2023-03-30",
        difficulty: "high",
      });
    });

    it("should handle convenience parameters", () => {
      const task = new Task({
        description: "Call Mom",
        priority: "A",
        context: "phone",
        project: "Family",
        due: "2023-04-05",
      });

      expect(task.priority).toBe("(A)");
      expect(task.contexts).toContain("@phone");
      expect(task.projects).toContain("+Family");
      expect(task.keyValues.due).toBe("2023-04-05");
    });

    it("should handle incorrectly formatted priorities", () => {
      const task1 = new Task({ priority: "a" });
      expect(task1.priority).toBe("(A)");

      const task2 = new Task({ priority: "(X)" });
      expect(task2.priority).toBe("(X)");

      const task3 = new Task({ priority: "X" });
      expect(task3.priority).toBe("(X)");
    });
  });

  describe("Description Management", () => {
    it("should set description", () => {
      task.setDescription("New description");
      expect(task.description).toBe("New description");
    });
  });

  describe("Due Date Handling", () => {
    it("should set and get due date", () => {
      task.setDueDate("2023-05-01");
      expect(task.getDueDate()).toBe("2023-05-01");
    });

    it("should correctly identify tasks due today", () => {
      task.setDueDate(TODAY);
      expect(task.isDueToday()).toBe(true);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      task.setDueDate(tomorrow.toISOString().split("T")[0]);
      expect(task.isDueToday()).toBe(false);
    });

    it("should correctly identify overdue tasks", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      task.setDueDate(yesterday.toISOString().split("T")[0]);
      expect(task.isOverdue()).toBe(true);

      task.setDueDate(TODAY);
      expect(task.isOverdue()).toBe(false);

      // Completed tasks are not overdue
      task.setDueDate(yesterday.toISOString().split("T")[0]);
      task.markCompleted();
      expect(task.isOverdue()).toBe(false);
    });

    it("should calculate days until due", () => {
      const futureDateObj = new Date();
      futureDateObj.setDate(futureDateObj.getDate() + 3);
      const futureDate = futureDateObj.toISOString().split("T")[0];

      task.setDueDate(futureDate);
      expect(task.daysUntilDue()).toBe(3);

      const pastDateObj = new Date();
      pastDateObj.setDate(pastDateObj.getDate() - 2);
      const pastDate = pastDateObj.toISOString().split("T")[0];

      task.setDueDate(pastDate);
      expect(task.daysUntilDue()).toBe(-2);
    });
  });

  describe("Completion Status", () => {
    it("should mark task as completed with date", () => {
      task.markCompleted("2023-04-01");
      expect(task.completed).toBe(true);
      expect(task.completionDate).toBe("2023-04-01");
    });

    it("should use today's date when no completion date is provided", () => {
      task.markCompleted();
      expect(task.completed).toBe(true);
      expect(task.completionDate).toBe(TODAY);
    });

    it("should mark task as incomplete and clear completion date", () => {
      task.markCompleted("2023-04-01");
      task.markIncomplete();
      expect(task.completed).toBe(false);
      expect(task.completionDate).toBeUndefined();
    });

    it("should toggle completion status", () => {
      expect(task.completed).toBe(false);

      const result1 = task.toggleCompletion();
      expect(task.completed).toBe(true);
      expect(result1).toBe(true);
      expect(task.completionDate).toBeDefined();

      const result2 = task.toggleCompletion();
      expect(task.completed).toBe(false);
      expect(result2).toBe(false);
      expect(task.completionDate).toBeUndefined();
    });
  });

  describe("Context Management", () => {
    it("should add contexts with @ symbol", () => {
      task.addContext("work");
      expect(task.contexts).toContain("@work");
    });

    it("should add contexts with @ symbol already included", () => {
      task.addContext("@home");
      expect(task.contexts).toContain("@home");
    });

    it("should not add duplicate contexts", () => {
      task.addContext("work");
      task.addContext("@work");
      expect(task.contexts.length).toBe(1);
      expect(task.contexts).toContain("@work");
    });

    it("should remove contexts", () => {
      task.addContext("work");
      task.addContext("home");
      expect(task.contexts.length).toBe(2);

      task.removeContext("work");
      expect(task.contexts.length).toBe(1);
      expect(task.contexts).not.toContain("@work");
      expect(task.contexts).toContain("@home");
    });
  });

  describe("Project Management", () => {
    it("should add projects with + symbol", () => {
      task.addProject("personal");
      expect(task.projects).toContain("+personal");
    });

    it("should add projects with + symbol already included", () => {
      task.addProject("+work");
      expect(task.projects).toContain("+work");
    });

    it("should not add duplicate projects", () => {
      task.addProject("work");
      task.addProject("+work");
      expect(task.projects.length).toBe(1);
      expect(task.projects).toContain("+work");
    });

    it("should remove projects", () => {
      task.addProject("work");
      task.addProject("home");
      expect(task.projects.length).toBe(2);

      task.removeProject("work");
      expect(task.projects.length).toBe(1);
      expect(task.projects).not.toContain("+work");
      expect(task.projects).toContain("+home");
    });
  });

  describe("Priority Management", () => {
    it("should set priority correctly", () => {
      task.setPriority("A");
      expect(task.priority).toBe("(A)");

      task.setPriority("(C)");
      expect(task.priority).toBe("(C)");

      task.setPriority(null);
      expect(task.priority).toBeUndefined();
    });

    it("should increase priority", () => {
      task.setPriority("C");
      expect(task.priority).toBe("(C)");

      task.increasePriority();
      expect(task.priority).toBe("(B)");

      task.increasePriority();
      expect(task.priority).toBe("(A)");

      // No change when already at A
      task.increasePriority();
      expect(task.priority).toBe("(A)");
    });

    it("should set priority to Z when increasing from none", () => {
      task.setPriority(null);
      expect(task.priority).toBeUndefined();

      task.increasePriority();
      expect(task.priority).toBe("(Z)");
    });

    it("should decrease priority", () => {
      task.setPriority("A");
      expect(task.priority).toBe("(A)");

      task.decreasePriority();
      expect(task.priority).toBe("(B)");

      // Skip to Z
      task.setPriority("Z");
      task.decreasePriority();
      expect(task.priority).toBeUndefined();
    });
  });

  describe("Key-Value Management", () => {
    it("should set and get key-value pairs", () => {
      task.setKeyValue("difficulty", "hard");
      expect(task.keyValues["difficulty"]).toBe("hard");

      task.setKeyValue("estimate", 2.5);
      expect(task.keyValues["estimate"]).toBe(2.5);
    });

    it("should remove key-value pairs", () => {
      task.setKeyValue("difficulty", "hard");
      task.setKeyValue("estimate", 2.5);

      task.removeKeyValue("difficulty");
      expect(task.keyValues["difficulty"]).toBeUndefined();
      expect(task.keyValues["estimate"]).toBe(2.5);
    });
  });

  describe("Recurrence", () => {
    it("should set recurrence pattern", () => {
      task.setRecurrence({ type: "weekly", interval: 2 });
      expect(task.keyValues["rec"]).toBe("2w");
    });

    it("should get recurrence pattern", () => {
      task.setKeyValue("rec", "3d");
      const pattern = task.getRecurrence();
      expect(pattern).toEqual({ type: "daily", interval: 3 });

      task.setKeyValue("rec", "1m");
      expect(task.getRecurrence()).toEqual({ type: "monthly", interval: 1 });

      task.setKeyValue("rec", "5y");
      expect(task.getRecurrence()).toEqual({ type: "yearly", interval: 5 });
    });

    it("should return undefined for invalid recurrence patterns", () => {
      task.setKeyValue("rec", "invalid");
      expect(task.getRecurrence()).toBeUndefined();

      task.setKeyValue("rec", "5x"); // Invalid type
      expect(task.getRecurrence()).toBeUndefined();
    });

    it("should generate recurring task with correct due date", () => {
      task.setDueDate("2023-04-10");
      task.setRecurrence({ type: "weekly", interval: 2 });

      const newTask = task.generateRecurringTask();
      expect(newTask).toBeDefined();
      expect(newTask?.getDueDate()).toBe("2023-04-24"); // 2 weeks later

      // Should preserve other properties
      expect(newTask?.description).toBe(task.description);
      expect(newTask?.priority).toBe(task.priority);
    });

    it("should not generate recurring task without due date", () => {
      task.setRecurrence({ type: "weekly", interval: 2 });
      const newTask = task.generateRecurringTask();
      expect(newTask).toBeUndefined();
    });

    it("should not generate recurring task without recurrence pattern", () => {
      task.setDueDate("2023-04-10");
      const newTask = task.generateRecurringTask();
      expect(newTask).toBeUndefined();
    });
  });

  describe("String Representation", () => {
    it("should convert task to correct string format", () => {
      task = new Task({
        description: "Test task",
        priority: "A",
        projects: ["+project"],
        contexts: ["@context"],
        keyValues: { due: "2023-04-10" },
      });

      const str = task.toString();
      expect(str).toBe("(A) Test task +project @context due:2023-04-10");

      // Completed task
      task.markCompleted("2023-04-01");
      task.creationDate = "2023-03-15";
      const completedStr = task.toString();
      expect(completedStr).toBe(
        "x 2023-04-01 2023-03-15 Test task +project @context due:2023-04-10"
      );
    });
  });

  describe("Task Cloning", () => {
    it("should create a deep copy of the task", () => {
      task = new Task({
        description: "Original task",
        priority: "A",
        projects: ["+project"],
        contexts: ["@context"],
        keyValues: { due: "2023-04-10" },
      });

      const clone = task.clone();

      // Verify all properties match
      expect(clone.description).toBe(task.description);
      expect(clone.priority).toBe(task.priority);
      expect(clone.projects).toEqual(task.projects);
      expect(clone.contexts).toEqual(task.contexts);
      expect(clone.keyValues).toEqual(task.keyValues);

      // Verify it's a different object
      expect(clone).not.toBe(task);
      expect(clone.id).not.toBe(task.id);

      // Verify it's a deep copy (modifying one doesn't affect the other)
      clone.description = "Modified task";
      clone.projects.push("+newproject");
      clone.keyValues.due = "2023-05-01";

      expect(task.description).toBe("Original task");
      expect(task.projects).not.toContain("+newproject");
      expect(task.keyValues.due).toBe("2023-04-10");
    });
  });
});
