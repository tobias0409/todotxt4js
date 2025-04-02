/**
 * @fileoverview Provides the TodoList class for managing collections of tasks.
 * This class handles parsing, adding, editing, and deleting todo.txt tasks, along with
 * querying and filtering functionalities.
 * @module TodoList
 */

import { Scanner } from "./Scanner";
import { Parser, ParserOptions } from "./Parser";
import { Task } from "./Task";

/**
 * A class representing a collection of todo.txt tasks.
 * Provides methods for parsing, managing, and querying tasks in the todo.txt format.
 */
export class TodoList {
  /** Array of Task objects managed by this TodoList */
  tasks: Task[];

  /**
   * Creates a new TodoList instance.
   * @param {string} [text] - Optional todotxt text to parse into tasks.
   */
  constructor(text?: string) {
    this.tasks = [];

    if (text) {
      this.parse(text);
    }
  }

  /**
   * Parse a multiline todotxt text. Each non-empty line is parsed as a separate task.
   * Throws an error if any task fails to parse.
   * @param {string} text - The todotxt formatted string to parse.
   * @param {ParserOptions} [parserOptions] - Optional configuration for the parser.
   */
  public parse(text: string, parserOptions?: ParserOptions): void;

  /**
   * Add multiple task objects directly to the list.
   * @param {Task[]} tasks - Array of Task objects to add to the list.
   */
  public parse(tasks: Task[]): void;

  /**
   * Implementation of parse that handles both overloads.
   * @param {string|Task[]} textOrTasks - Either a todotxt string or an array of Task objects.
   * @param {ParserOptions} [parserOptions] - Optional configuration for the parser.
   */
  public parse(
    textOrTasks: string | Task[],
    parserOptions?: ParserOptions
  ): void {
    this.tasks = [];

    if (typeof textOrTasks === "string") {
      const lines = textOrTasks
        .split(/\r?\n/)
        .filter((line) => line.trim() !== "");
      const scanner = new Scanner();
      for (const line of lines) {
        const tokens = scanner.scan(line);
        const parser = new Parser(tokens, parserOptions);
        const task = parser.parseTask();
        this.tasks.push(task);
      }
    } else {
      // Array of Task objects
      this.tasks = [...textOrTasks];
    }
  }

  /**
   * Returns all tasks in the list.
   * @returns {Task[]} Array of all Task objects.
   */
  public getTasks(): Task[] {
    return this.tasks;
  }

  /**
   * Get a specific task by its unique identifier.
   * @param {string} taskId - The unique identifier of the task to retrieve.
   * @returns {Task|undefined} The matching task or undefined if not found.
   */
  public getTask(taskId: string): Task | undefined {
    return this.tasks.find((task) => task.id === taskId);
  }

  /**
   * Get tasks that match a specific property value.
   * @param {keyof Task} property - The property name to match.
   * @param {any} value - The value to match against.
   * @returns {Task[]} Array of tasks matching the property value.
   */
  public getTasksByProperty<T extends keyof Task>(
    property: T,
    value: Task[T]
  ): Task[] {
    return this.tasks.filter((task) => task[property] === value);
  }

  /**
   * Get tasks that match a specific key-value pair.
   * @param {string} key - The key name to match.
   * @param {any} value - The value to match against.
   * @returns {Task[]} Array of tasks matching the key-value pair.
   */
  public getTasksByKeyValue(key: string, value: any): Task[] {
    return this.tasks.filter((task) => {
      const taskValue = task.keyValues[key];
      if (Array.isArray(taskValue)) {
        return taskValue.includes(value);
      } else {
        return taskValue === value;
      }
    });
  }

  /**
   * Get tasks that include a specific context.
   * @param {string} context - The context to search for (without the @ symbol).
   * @returns {Task[]} Array of tasks containing the specified context.
   */
  public getTasksByContext(context: string): Task[] {
    return this.tasks.filter((task) => task.contexts.includes(context));
  }

  /**
   * Get tasks that include a specific project.
   * @param {string} project - The project to search for (without the + symbol).
   * @returns {Task[]} Array of tasks containing the specified project.
   */
  public getTasksByProject(project: string): Task[] {
    return this.tasks.filter((task) => task.projects.includes(project));
  }

  /**
   * Get tasks that are marked as completed.
   * @returns {Task[]} Array of completed tasks.
   */
  public getCompletedTasks(): Task[] {
    return this.tasks.filter((task) => task.completed);
  }

  /**
   * Get tasks that are not marked as completed.
   * @returns {Task[]} Array of incomplete tasks.
   */
  public getIncompleteTasks(): Task[] {
    return this.tasks.filter((task) => !task.completed);
  }

  /**
   * Get tasks that are due today.
   * @returns {Task[]} Array of tasks due today.
   */
  public getDueTodayTasks(): Task[] {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    return this.tasks.filter((task) => {
      const dueDate = task.keyValues["due"];
      return dueDate && dueDate === today;
    });
  }

  /**
   * Get tasks that are past their due date and not completed.
   * @returns {Task[]} Array of overdue tasks.
   */
  public getOverdueTasks(): Task[] {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    return this.tasks.filter((task) => {
      const dueDate = task.keyValues["due"];
      return dueDate && dueDate < today && !task.completed;
    });
  }

  /**
   * Get tasks that are due within a specified number of days from today.
   * @param {number} n - Number of days from today.
   * @returns {Task[]} Array of tasks due within the specified time period.
   */
  public getDueInNextNDaysTasks(n: number): Task[] {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + n);
    const futureDateString = futureDate.toISOString().split("T")[0]; // YYYY-MM-DD

    return this.tasks.filter((task) => {
      const dueDate = task.keyValues["due"];
      return dueDate && dueDate <= futureDateString && !task.completed;
    });
  }

  /**
   * Add a new task from a single line of text.
   * @param {string} line - The todotxt formatted line to parse.
   * @param {ParserOptions} [parserOptions] - Optional configuration for the parser.
   */
  public addTask(line: string, parserOptions?: ParserOptions): void;

  /**
   * Add a task object directly to the list.
   * @param {Task} task - The Task object to add.
   */
  public addTask(task: Task): void;

  /**
   * Implementation of addTask that handles both overloads.
   * @param {string|Task} taskOrLine - Either a todotxt string or a Task object.
   * @param {ParserOptions} [parserOptions] - Optional configuration for the parser.
   */
  public addTask(
    taskOrLine: string | Task,
    parserOptions?: ParserOptions
  ): void {
    if (typeof taskOrLine === "string") {
      // String input - parse it
      const scanner = new Scanner();
      const tokens = scanner.scan(taskOrLine);
      const parser = new Parser(tokens, parserOptions);
      const task = parser.parseTask();
      this.tasks.push(task);
    } else {
      // Task object input - add directly
      this.tasks.push(taskOrLine);
    }
  }

  /**
   * Edit a task by id using an updater function.
   * @param {string} taskId - The unique identifier of the task to edit.
   * @param {function} updater - Function that modifies the task object.
   * @throws {Error} If the task with the specified ID is not found.
   */
  public editTask(taskId: string, updater: (task: Task) => void): void;

  /**
   * Edit a task by providing a task object with the same ID.
   * @param {Task} updatedTask - The modified Task object with the same ID as the task to replace.
   * @throws {Error} If the task with the specified ID is not found.
   */
  public editTask(updatedTask: Task): void;

  /**
   * Implementation of editTask that handles both overloads.
   * @param {string|Task} taskIdOrTask - Either a task ID or a Task object.
   * @param {function} [updater] - Function that modifies the task object.
   * @throws {Error} If the task with the specified ID is not found.
   */
  public editTask(
    taskIdOrTask: string | Task,
    updater?: (task: Task) => void
  ): void {
    if (typeof taskIdOrTask === "string") {
      // String taskId input
      const task = this.tasks.find((t) => t.id === taskIdOrTask);
      if (!task) throw new Error(`Task with id ${taskIdOrTask} not found.`);
      updater!(task);
    } else {
      // Task object input
      const index = this.tasks.findIndex((t) => t.id === taskIdOrTask.id);
      if (index === -1)
        throw new Error(`Task with id ${taskIdOrTask.id} not found.`);
      this.tasks[index] = taskIdOrTask;
    }
  }

  /**
   * Delete a task by id.
   * @param {string} taskId - The unique identifier of the task to delete.
   */
  public deleteTask(taskId: string): void;

  /**
   * Delete a task by object reference.
   * @param {Task} task - The Task object to delete.
   */
  public deleteTask(task: Task): void;

  /**
   * Implementation of deleteTask that handles both overloads.
   * @param {string|Task} taskIdOrTask - Either a task ID or a Task object.
   */
  public deleteTask(taskIdOrTask: string | Task): void {
    if (typeof taskIdOrTask === "string") {
      // String taskId input
      this.tasks = this.tasks.filter((t) => t.id !== taskIdOrTask);
    } else {
      // Task object input
      this.tasks = this.tasks.filter((t) => t.id !== taskIdOrTask.id);
    }
  }

  /**
   * Convert the todo list back to a string representation.
   * This generates a complete todotxt output with one task per line.
   * @returns {string} The string representation of all tasks.
   */
  public toString(): string {
    return this.tasks
      .map((task) => {
        const parts: string[] = [];
        if (task.completed) {
          parts.push("x");
          if (task.completionDate) {
            parts.push(task.completionDate);
          }
          if (task.creationDate) {
            parts.push(task.creationDate);
          }
        } else {
          if (task.priority) {
            parts.push(task.priority);
          }
          if (task.creationDate) {
            parts.push(task.creationDate);
          }
        }
        parts.push(task.description);
        // Append key-value pairs.
        for (const key in task.keyValues) {
          const value = task.keyValues[key];
          if (Array.isArray(value)) {
            parts.push(`${key}:${value.join(",")}`);
          } else {
            parts.push(`${key}:${value}`);
          }
        }
        return parts.join(" ");
      })
      .join("\n");
  }

  /**
   * Sort tasks by a given criteria.
   * @param {string} criteria - The criteria to sort by: "priority", "due", "creation", or "completion".
   */
  public sortBy(
    criteria: "priority" | "due" | "creation" | "completion"
  ): void {
    this.tasks.sort((a, b) => {
      if (criteria === "priority") {
        return (a.priority || "").localeCompare(b.priority || "");
      } else if (criteria === "due") {
        return (a.keyValues["due"] || "").localeCompare(
          b.keyValues["due"] || ""
        );
      } else if (criteria === "creation") {
        return (a.creationDate || "").localeCompare(b.creationDate || "");
      } else if (criteria === "completion") {
        return (a.completionDate || "").localeCompare(b.completionDate || "");
      }
      return 0;
    });
  }

  /**
   * Filter tasks based on multiple criteria.
   * @param {Object} criteria - An object containing filter criteria.
   * @param {boolean} [criteria.completed] - Whether to include completed tasks.
   * @param {string} [criteria.priority] - Filter by priority.
   * @param {string} [criteria.project] - Filter by project name.
   * @param {string} [criteria.context] - Filter by context name.
   * @param {string} [criteria.dueAfter] - Include tasks due after this date (YYYY-MM-DD).
   * @param {string} [criteria.dueBefore] - Include tasks due before this date (YYYY-MM-DD).
   * @returns {Task[]} Array of tasks matching all specified criteria.
   */
  public filter(criteria: {
    completed?: boolean;
    priority?: string;
    project?: string;
    context?: string;
    dueAfter?: string;
    dueBefore?: string;
  }): Task[] {
    return this.tasks.filter((task) => {
      if (
        criteria.completed !== undefined &&
        task.completed !== criteria.completed
      )
        return false;
      if (criteria.priority && task.priority !== criteria.priority)
        return false;
      if (criteria.project && !task.projects.includes(criteria.project))
        return false;
      if (criteria.context && !task.contexts.includes(criteria.context))
        return false;

      const dueDate = task.keyValues["due"];
      if (dueDate) {
        if (criteria.dueAfter && dueDate < criteria.dueAfter) {
          return false;
        }
        if (criteria.dueBefore && dueDate > criteria.dueBefore) {
          return false;
        }
      } else if (criteria.dueAfter || criteria.dueBefore) {
        return false;
      }

      return true;
    });
  }
}
