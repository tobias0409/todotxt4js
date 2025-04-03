import { describe, it, expect, beforeEach } from "@jest/globals";
import { TodoList, Task } from "../src/index";

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

    // Add sample tasks with reliable dates
    const task1 = new Task({
      priority: "A",
      description: "High priority task",
      contexts: ["@work"],
      projects: ["+project1"],
      keyValues: { due: TODAY },
    });
    todoList.addTask(task1);

    const task2 = new Task({
      priority: "B",
      description: "Medium priority task",
      contexts: ["@home"],
      projects: ["+project1", "+project2"],
      keyValues: { due: futureDateString },
    });
    todoList.addTask(task2);

    const task3 = new Task({
      priority: "C",
      description: "Low priority task overdue",
      contexts: ["@work"],
      projects: ["+project2"],
      keyValues: { due: pastDateString },
    });
    todoList.addTask(task3);

    const completedTask = new Task({
      description: "Completed task",
      contexts: ["@home"],
      projects: ["+project3"],
    });
    completedTask.markCompleted("2023-03-01");
    todoList.addTask(completedTask);
  });

  describe("Getting Tasks by Line Number", () => {
    it("should return task at specific line number", () => {
      const task = todoList.getTaskByLineNumber(1);
      expect(task).toBeDefined();
      expect(task?.description).toBe("Medium priority task");
    });

    it("should return undefined for out of bounds line numbers", () => {
      expect(todoList.getTaskByLineNumber(-1)).toBeUndefined();
      expect(todoList.getTaskByLineNumber(10)).toBeUndefined();
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

  describe("Filtering Tasks", () => {
    it("should filter tasks by multiple criteria", () => {
      const filteredTasks = todoList.filter({
        completed: false,
        project: "+project1",
        context: "@work",
      });

      expect(filteredTasks).toHaveLength(1);
      expect(filteredTasks[0].description).toBe("High priority task");
    });

    it("should filter by date ranges", () => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 60); // 60 days in future

      const futureTasks = todoList.filter({
        dueBefore: futureDate.toISOString().split("T")[0],
        dueAfter: today.toISOString().split("T")[0],
      });

      // Should include task due today and future tasks
      expect(futureTasks.length).toBeGreaterThanOrEqual(1);
      expect(
        futureTasks.some(
          (t) =>
            t.description === "High priority task" ||
            t.description === "Medium priority task"
        )
      ).toBe(true);
    });
  });

  describe("Sorting Tasks", () => {
    it("should sort by priority", () => {
      todoList.sortBy("priority");
      const tasks = todoList.getTasks();

      // Find the first task with priority A - should be first after sorting
      const taskAPriority = tasks.find((t) => t.priority === "(A)");
      const taskBPriority = tasks.find((t) => t.priority === "(B)");
      const taskCPriority = tasks.find((t) => t.priority === "(C)");

      // Check that tasks with priorities are sorted correctly
      expect(tasks.indexOf(taskAPriority!)).toBeLessThan(
        tasks.indexOf(taskBPriority!)
      );
      expect(tasks.indexOf(taskBPriority!)).toBeLessThan(
        tasks.indexOf(taskCPriority!)
      );
    });

    it("should sort by completion date", () => {
      todoList.sortBy("completion");
      const tasks = todoList.getTasks();
      const completedTasks = tasks.filter((t) => t.completed);
      expect(completedTasks.length).toBeGreaterThan(0);
      expect(completedTasks[0].description).toBe("Completed task");
    });
  });

  describe("Task Queries", () => {
    it("should get tasks by context", () => {
      const workTasks = todoList.getTasksByContext("@work");
      expect(workTasks).toHaveLength(2);
      expect(workTasks.every((t) => t.contexts.includes("@work"))).toBe(true);
    });

    it("should get tasks by project", () => {
      const project2Tasks = todoList.getTasksByProject("+project2");
      expect(project2Tasks).toHaveLength(2);
      expect(project2Tasks.every((t) => t.projects.includes("+project2"))).toBe(
        true
      );
    });

    it("should get tasks by property", () => {
      const priorityATasks = todoList.getTasksByProperty("priority", "(A)");
      expect(priorityATasks).toHaveLength(1);
      expect(priorityATasks[0].description).toBe("High priority task");
    });

    it("should get tasks by key-value pair", () => {
      const todayTasks = todoList.getTasksByKeyValue("due", TODAY);
      expect(todayTasks.length).toBeGreaterThan(0);
      expect(todayTasks[0].description).toBe("High priority task");
    });
  });

  describe("Date-Based Queries", () => {
    it("should get due today tasks", () => {
      const todayTasks = todoList.getDueTodayTasks();
      expect(todayTasks.length).toBeGreaterThan(0);
      expect(todayTasks[0].keyValues.due).toBe(TODAY);
    });

    it("should get overdue tasks", () => {
      const overdueTasks = todoList.getOverdueTasks();
      expect(overdueTasks.length).toBeGreaterThan(0);

      // Find the task that has "Low priority task overdue" in the description
      const lowPriorityTask = overdueTasks.find(
        (t) => t.description === "Low priority task overdue"
      );
      expect(lowPriorityTask).toBeDefined();
    });

    it("should get tasks due in next N days", () => {
      const dueSoonTasks = todoList.getDueInNextNDaysTasks(365);
      expect(dueSoonTasks.length).toBeGreaterThan(1);

      // The task due today and the future task should be included
      expect(
        dueSoonTasks.some((t) => t.description === "High priority task")
      ).toBe(true);
      expect(
        dueSoonTasks.some((t) => t.description === "Medium priority task")
      ).toBe(true);
    });
  });

  describe("Task Operations", () => {
    it("should add a task with string parsing", () => {
      todoList.addTask(
        "(D) New task from string @stringContext +stringProject"
      );
      const lastTask = todoList.getTasks()[todoList.getTasks().length - 1];

      expect(lastTask.priority).toBe("(D)");
      expect(lastTask.description).toContain("New task from string");
      expect(lastTask.contexts).toContain("@stringContext");
      expect(lastTask.projects).toContain("+stringProject");
    });

    it("should edit a task with an updater function", () => {
      const taskToEdit = todoList.getTasks()[0];
      todoList.editTask(taskToEdit.id, (task) => {
        task.setDescription("Updated description");
        task.setPriority("Z");
      });

      const updatedTask = todoList.getTask(taskToEdit.id);
      expect(updatedTask?.description).toBe("Updated description");
      expect(updatedTask?.priority).toBe("(Z)");
    });

    it("should replace a task", () => {
      const originalTask = todoList.getTasks()[0];
      const replacementTask = new Task({
        description: "Replacement task",
        priority: originalTask.priority,
      });

      // Important: Use the same ID to ensure replacement works
      replacementTask.id = originalTask.id;

      todoList.editTask(replacementTask);

      const updatedTask = todoList.getTask(originalTask.id);
      expect(updatedTask?.description).toBe("Replacement task");
    });

    it("should delete a task by id", () => {
      const originalCount = todoList.getTasks().length;
      const taskToDelete = todoList.getTasks()[0];

      todoList.deleteTask(taskToDelete.id);

      expect(todoList.getTasks().length).toBe(originalCount - 1);
      expect(todoList.getTask(taskToDelete.id)).toBeUndefined();
    });

    it("should delete a task by object", () => {
      const originalCount = todoList.getTasks().length;
      const taskToDelete = todoList.getTasks()[0];

      todoList.deleteTask(taskToDelete);

      expect(todoList.getTasks().length).toBe(originalCount - 1);
      expect(todoList.getTask(taskToDelete.id)).toBeUndefined();
    });
  });

  describe("String Conversion", () => {
    it("should convert todo list to string format", () => {
      const str = todoList.toString();
      const lines = str.split("\n");

      expect(lines.length).toBe(4); // 4 tasks
      expect(lines.some((line) => line.includes("(A)"))).toBe(true);
      expect(lines.some((line) => line.includes("High priority task"))).toBe(
        true
      );

      expect(lines.some((line) => line.includes("x 2023-03-01"))).toBe(true);
      expect(lines.some((line) => line.includes("Completed task"))).toBe(true);
    });
  });
});
