/**
 * @fileoverview Provides the Task class representing a single todo.txt task.
 * Tasks encapsulate the properties of a todo.txt item including completion status,
 * priority, dates, projects, contexts, and key-value pairs.
 * @module Task
 */

/**
 * Class representing a single task in the todo.txt format.
 * A task includes completion status, priority, dates, descriptions,
 * and metadata like projects, contexts, and key-value pairs.
 */
export class Task {
  /** Unique identifier for the task */
  public id: string;

  /** Whether the task is marked as completed */
  public completed: boolean;

  /** Priority of the task, in the format "(A)" through "(Z)" */
  public priority?: string;

  /** Completion date in YYYY-MM-DD format */
  public completionDate?: string;

  /** Creation date in YYYY-MM-DD format */
  public creationDate?: string;

  /** Main text description of the task */
  public description: string;

  /** Array of project tags (starting with +) */
  public projects: string[];

  /** Array of context tags (starting with @) */
  public contexts: string[];

  /** Object storing key-value pairs as metadata */
  public keyValues: { [key: string]: any };

  /**
   * Creates a new Task instance.
   * @param {Object} [options] - Optional configuration for the new task.
   * @param {boolean} [options.completed] - Whether the task is completed.
   * @param {string} [options.priority] - The priority of the task.
   * @param {string} [options.completionDate] - When the task was completed.
   * @param {string} [options.creationDate] - When the task was created.
   * @param {string} [options.description] - The description text.
   * @param {string[]} [options.projects] - Array of project tags.
   * @param {string[]} [options.contexts] - Array of context tags.
   * @param {Object} [options.keyValues] - Key-value metadata.
   */
  constructor(
    options: {
      completed?: boolean;
      priority?: string;
      completionDate?: string;
      creationDate?: string;
      description?: string;
      projects?: string[];
      contexts?: string[];
      keyValues?: { [key: string]: any };
    } = {}
  ) {
    if (
      typeof window !== "undefined" &&
      window.crypto &&
      window.crypto.randomUUID
    ) {
      this.id = window.crypto.randomUUID();
    } else if (
      globalThis.crypto &&
      typeof globalThis.crypto.randomUUID === "function"
    ) {
      this.id = globalThis.crypto.randomUUID();
    } else {
      // Fallback (should not occur in supported environments)
      this.id = Math.random().toString(36).substr(2, 9);
    }
    this.completed = options.completed || false;
    this.priority = options.priority;
    this.completionDate = options.completionDate;
    this.creationDate = options.creationDate;
    this.description = options.description || "";
    this.projects = options.projects || [];
    this.contexts = options.contexts || [];
    this.keyValues = options.keyValues || {};
  }

  /**
   * Updates the task description.
   * @param {string} newDescription - The new description text.
   */
  public setDescription(newDescription: string): void {
    this.description = newDescription;
  }

  /**
   * Sets or updates the due date for the task.
   * @param {string} newDueDate - The new due date in YYYY-MM-DD format.
   */
  public setDueDate(newDueDate: string): void {
    this.keyValues["due"] = newDueDate;
  }

  /**
   * Marks the task as completed and sets the completion date.
   * @param {string} completionDate - The completion date in YYYY-MM-DD format.
   */
  public markCompleted(completionDate: string): void {
    this.completed = true;
    this.completionDate = completionDate;
  }
}
