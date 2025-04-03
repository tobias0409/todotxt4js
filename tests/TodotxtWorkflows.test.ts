import { describe, it, expect } from "@jest/globals";
import { TodoList, Task } from "../src/index";

describe("Todo.txt Complete Workflows", () => {
  describe("End-to-End Usage", () => {
    it("should perform a complete task lifecycle", () => {
      // Create a TodoList
      const todoList = new TodoList();

      // Add tasks in different ways
      todoList.addTask("(A) Call Mom @phone +Family due:2023-05-01");

      const task = new Task({
        description: "Prepare report",
        priority: "B",
        contexts: ["@work"],
        projects: ["+Project"],
        keyValues: { due: "2023-05-15" },
      });
      todoList.addTask(task);

      // Verify tasks were added
      expect(todoList.getTasks()).toHaveLength(2);

      // Get tasks by various criteria
      const familyTasks = todoList.getTasksByProject("+Family");
      expect(familyTasks).toHaveLength(1);
      expect(familyTasks[0].description).toContain("Call Mom");

      const phoneContextTasks = todoList.getTasksByContext("@phone");
      expect(phoneContextTasks).toHaveLength(1);

      // Edit a task
      const taskToEdit = todoList.getTasks()[0];
      todoList.editTask(taskToEdit.id, (task) => {
        task.addProject("Urgent");
        task.setPriority("A");
      });

      // Verify edits
      const editedTask = todoList.getTask(taskToEdit.id);
      expect(editedTask?.projects).toContain("+Urgent");

      // Complete a task
      todoList.editTask(taskToEdit.id, (task) => {
        task.markCompleted();
      });

      // Verify completion
      const completedTasks = todoList.getCompletedTasks();
      expect(completedTasks).toHaveLength(1);

      // Delete a task
      todoList.deleteTask(taskToEdit);

      // Verify deletion
      expect(todoList.getTasks()).toHaveLength(1);
      expect(todoList.getTask(taskToEdit.id)).toBeUndefined();

      // Convert back to string
      const output = todoList.toString();
      expect(output).toContain("(B)");
      expect(output).toContain("Prepare report");
      expect(output).toContain("@work");
      expect(output).toContain("+Project");
    });
  });

  describe("Recurrence Pattern Workflow", () => {
    it("should handle recurring tasks correctly", () => {
      // Create a recurring task
      const task = new Task({
        description: "Weekly meeting",
        priority: "B",
        contexts: ["@work"],
        keyValues: { due: "2023-05-01" },
      });

      // Set recurrence
      task.setRecurrence({ type: "weekly", interval: 1 });

      // Generate next instance
      const nextTask = task.generateRecurringTask();
      expect(nextTask).toBeDefined();
      expect(nextTask?.getDueDate()).toBe("2023-05-08"); // One week later

      // Generate a chain of tasks
      let currentTask = task;
      const generatedDates: string[] = [];

      for (let i = 0; i < 4; i++) {
        const next = currentTask.generateRecurringTask();
        if (next) {
          generatedDates.push(next.getDueDate()!);
          currentTask = next;
        }
      }

      expect(generatedDates).toEqual([
        "2023-05-08",
        "2023-05-15",
        "2023-05-22",
        "2023-05-29",
      ]);
    });
  });

  describe("Custom Key Handlers Workflow", () => {
    it("should apply custom key handlers during parsing", () => {
      // Define custom key handlers
      const handlers = [
        {
          key: "due",
          validate: (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value),
          transform: (value: string) => new Date(value),
        },
        {
          key: "priority",
          transform: (value: string) => parseInt(value),
        },
      ];

      // Create a TodoList with custom key handlers
      const todoList = new TodoList();

      // Parse with custom handlers
      todoList.parse("Task due:2023-05-01 priority:3", {
        customKeyHandlers: handlers,
      });

      // Verify transformations were applied
      const task = todoList.getTasks()[0];
      expect(task.keyValues["due"] instanceof Date).toBe(true);
      expect(task.keyValues["due"].getFullYear()).toBe(2023);
      expect(typeof task.keyValues["priority"]).toBe("number");
      expect(task.keyValues["priority"]).toBe(3);
    });
  });

  describe("Real-world Todo.txt Format", () => {
    it("should parse and process standard Todo.txt format examples", () => {
      const todoTxtContent = `
x 2023-04-30 2023-04-25 Completed task @done
(A) 2023-05-01 Call Mom +Family @phone due:2023-05-01
(B) Finish documentation +Work @computer due:2023-05-15
Take dog for walk @outside +Pets
2023-05-01 Submit tax return +Financial @important due:2023-05-20
`;

      const todoList = new TodoList(todoTxtContent);

      // Verify correct parsing
      expect(todoList.getTasks()).toHaveLength(5);
      expect(todoList.getCompletedTasks()).toHaveLength(1);
      expect(todoList.getIncompleteTasks()).toHaveLength(4);

      // Verify projects were extracted
      const projects = todoList.getProjects();
      expect(projects).toHaveLength(4);
      expect(projects).toContain("+Family");
      expect(projects).toContain("+Work");
      expect(projects).toContain("+Financial");
      expect(projects).toContain("+Pets");

      // Verify contexts were extracted
      const contexts = todoList.getContexts();
      expect(contexts.length).toBeGreaterThanOrEqual(4);
      expect(contexts).toContain("@phone");
      expect(contexts).toContain("@computer");
      expect(contexts).toContain("@outside");
      expect(contexts).toContain("@important");

      // Verify priority sorting
      todoList.sortBy("priority");

      // After sorting, prioritized tasks should come first
      const prioritizedTasks = todoList.getTasks().filter((t) => t.priority);
      expect(prioritizedTasks.length).toBeGreaterThan(0);
      expect(prioritizedTasks[0].priority).toBe("(A)");

      // Verify we can convert back to string representation
      const output = todoList.toString();
      const lines = output.split("\n").filter((line) => line.trim() !== "");
      expect(lines).toHaveLength(5);
    });
  });
});
