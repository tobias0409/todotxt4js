/**
 * @fileoverview Provides the Task class representing a single todo.txt task.
 * Tasks encapsulate the properties of a todo.txt item including completion status,
 * priority, dates, projects, contexts, and key-value pairs.
 * @module Task
 */

/**
 * Interface for recurrence pattern configuration
 */
export interface RecurrencePattern {
  /** Type of recurrence: daily, weekly, monthly, yearly */
  type: "daily" | "weekly" | "monthly" | "yearly";

  /** Number of units (days, weeks, etc.) between recurrences */
  interval: number;
}

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
   * @param {string} [options.priority] - The priority of the task (A-Z or in format "(A)").
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
      // Allow convenience parameters for common use cases
      project?: string; // Single project
      context?: string; // Single context
      due?: string; // Due date
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
    this.completionDate = options.completionDate;
    this.creationDate = options.creationDate;
    this.description = options.description || "";

    // Format priority correctly if provided
    if (options.priority) {
      this.setPriority(options.priority);
    } else {
      this.priority = undefined;
    }

    // Handle projects array or single project
    this.projects = [...(options.projects || [])];
    if (options.project) {
      this.addProject(options.project);
    }

    // Handle contexts array or single context
    this.contexts = [...(options.contexts || [])];
    if (options.context) {
      this.addContext(options.context);
    }

    // Initialize keyValues with provided object
    this.keyValues = { ...(options.keyValues || {}) };

    // Add due date if provided
    if (options.due) {
      this.keyValues["due"] = options.due;
    }
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
   * Gets the due date of the task, if any.
   * @returns {string|undefined} The due date in YYYY-MM-DD format or undefined.
   */
  public getDueDate(): string | undefined {
    return this.keyValues["due"];
  }

  /**
   * Checks if the task is due today.
   * @returns {boolean} True if the task is due today.
   */
  public isDueToday(): boolean {
    const dueDate = this.keyValues["due"];
    return dueDate === this.getTodayString();
  }

  /**
   * Checks if the task is overdue.
   * @returns {boolean} True if the task is overdue and not completed.
   */
  public isOverdue(): boolean {
    const dueDate = this.keyValues["due"];
    return !this.completed && !!dueDate && dueDate < this.getTodayString();
  }

  /**
   * Calculates the number of days until the task is due.
   * @returns {number|undefined} Number of days, or undefined if no due date.
   */
  public daysUntilDue(): number | undefined {
    const dueDate = this.keyValues["due"];
    if (!dueDate) return undefined;

    // Use the mocked getTodayString method for consistent testing
    const today = new Date(this.getTodayString());
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffMs = due.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Marks the task as completed and sets the completion date.
   * @param {string} [completionDate] - The completion date in YYYY-MM-DD format. Defaults to today.
   */
  public markCompleted(completionDate?: string): void {
    this.completed = true;
    this.completionDate = completionDate || this.getTodayString();
  }

  /**
   * Marks the task as incomplete and removes completion date.
   */
  public markIncomplete(): void {
    this.completed = false;
    this.completionDate = undefined;
  }

  /**
   * Toggles the completion status of the task.
   * @returns {boolean} The new completion status.
   */
  public toggleCompletion(): boolean {
    if (this.completed) {
      this.markIncomplete();
    } else {
      this.markCompleted();
    }
    return this.completed;
  }

  /**
   * Adds a context to the task.
   * @param {string} context - The context to add (with or without @ symbol).
   */
  public addContext(context: string): void {
    if (!context.startsWith("@")) {
      context = "@" + context;
    }
    if (!this.contexts.includes(context)) {
      this.contexts.push(context);
    }
  }

  /**
   * Removes a context from the task.
   * @param {string} context - The context to remove (with or without @ symbol).
   */
  public removeContext(context: string): void {
    if (!context.startsWith("@")) {
      context = "@" + context;
    }
    this.contexts = this.contexts.filter((c) => c !== context);
  }

  /**
   * Adds a project to the task.
   * @param {string} project - The project to add (with or without + symbol).
   */
  public addProject(project: string): void {
    if (!project.startsWith("+")) {
      project = "+" + project;
    }
    if (!this.projects.includes(project)) {
      this.projects.push(project);
    }
  }

  /**
   * Removes a project from the task.
   * @param {string} project - The project to remove (with or without + symbol).
   */
  public removeProject(project: string): void {
    if (!project.startsWith("+")) {
      project = "+" + project;
    }
    this.projects = this.projects.filter((p) => p !== project);
  }

  /**
   * Sets the priority of the task.
   * @param {string|null} priority - Priority letter (A-Z) or null to remove priority.
   */
  public setPriority(priority: string | null): void {
    if (priority === null) {
      this.priority = undefined;
      return;
    }

    // Extract the letter if it's in the format "(A)"
    if (
      priority.startsWith("(") &&
      priority.endsWith(")") &&
      priority.length === 3
    ) {
      priority = priority.charAt(1);
    }

    // Ensure it's a single uppercase letter A-Z
    priority = priority.toUpperCase().charAt(0);
    if (priority >= "A" && priority <= "Z") {
      this.priority = `(${priority})`;
    }
  }

  /**
   * Increases the priority of the task (e.g., B -> A).
   * If no priority is set, sets it to (Z).
   * If already at (A), does nothing.
   * @returns {string|undefined} The new priority.
   */
  public increasePriority(): string | undefined {
    if (!this.priority) {
      this.priority = "(Z)";
      return this.priority;
    }

    const currentLetter = this.priority.charAt(1);
    if (currentLetter > "A") {
      const newLetter = String.fromCharCode(currentLetter.charCodeAt(0) - 1);
      this.priority = `(${newLetter})`;
    }
    return this.priority;
  }

  /**
   * Decreases the priority of the task (e.g., A -> B).
   * If no priority is set or already at (Z), does nothing.
   * @returns {string|undefined} The new priority or undefined if removed.
   */
  public decreasePriority(): string | undefined {
    if (!this.priority) {
      return undefined;
    }

    const currentLetter = this.priority.charAt(1);
    if (currentLetter >= "A" && currentLetter < "Z") {
      const newLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
      this.priority = `(${newLetter})`;
    } else if (currentLetter === "Z") {
      this.priority = undefined;
    }
    return this.priority;
  }

  /**
   * Sets a key-value pair on the task.
   * @param {string} key - The key name.
   * @param {any} value - The value to store.
   */
  public setKeyValue(key: string, value: any): void {
    this.keyValues[key] = value;
  }

  /**
   * Removes a key-value pair from the task.
   * @param {string} key - The key name to remove.
   */
  public removeKeyValue(key: string): void {
    delete this.keyValues[key];
  }

  /**
   * Sets a recurrence pattern for the task.
   * @param {RecurrencePattern} pattern - The recurrence pattern configuration.
   */
  public setRecurrence(pattern: RecurrencePattern): void {
    const recString = `${pattern.interval}${pattern.type.charAt(0)}`;
    this.keyValues["rec"] = recString;
  }

  /**
   * Gets the current recurrence pattern if it exists.
   * @returns {RecurrencePattern|undefined} The recurrence pattern or undefined.
   */
  public getRecurrence(): RecurrencePattern | undefined {
    const recString = this.keyValues["rec"];
    if (!recString || typeof recString !== "string") return undefined;

    const match = recString.match(/^(\d+)([dwmy])$/i);
    if (!match) return undefined;

    const interval = parseInt(match[1], 10);
    const typeChar = match[2].toLowerCase();

    let type: "daily" | "weekly" | "monthly" | "yearly";
    switch (typeChar) {
      case "d":
        type = "daily";
        break;
      case "w":
        type = "weekly";
        break;
      case "m":
        type = "monthly";
        break;
      case "y":
        type = "yearly";
        break;
      default:
        return undefined;
    }

    return { interval, type };
  }

  /**
   * Generates a new task based on this task's recurrence pattern.
   * @returns {Task|undefined} A new recurring task, or undefined if no recurrence.
   */
  public generateRecurringTask(): Task | undefined {
    const recPattern = this.getRecurrence();
    if (!recPattern) return undefined;

    const dueDate = this.keyValues["due"];
    if (!dueDate) return undefined;

    // Clone the task
    const newTask = new Task({
      priority: this.priority,
      description: this.description,
      projects: [...this.projects],
      contexts: [...this.contexts],
      keyValues: { ...this.keyValues },
    });

    // Calculate new due date
    const newDueDate = this.calculateNextDueDate(dueDate, recPattern);
    if (newDueDate) {
      newTask.setDueDate(newDueDate);
    }

    return newTask;
  }

  /**
   * Calculates the next due date based on the recurrence pattern.
   * @param {string} dueDate - The current due date in YYYY-MM-DD format.
   * @param {RecurrencePattern} pattern - The recurrence pattern.
   * @returns {string} The next due date in YYYY-MM-DD format.
   * @private
   */
  private calculateNextDueDate(
    dueDate: string,
    pattern: RecurrencePattern
  ): string {
    const date = new Date(dueDate);

    switch (pattern.type) {
      case "daily":
        date.setDate(date.getDate() + pattern.interval);
        break;
      case "weekly":
        date.setDate(date.getDate() + pattern.interval * 7);
        break;
      case "monthly":
        date.setMonth(date.getMonth() + pattern.interval);
        break;
      case "yearly":
        date.setFullYear(date.getFullYear() + pattern.interval);
        break;
    }

    return date.toISOString().split("T")[0];
  }

  /**
   * Converts the task to a todotxt formatted string.
   * @returns {string} The task in todotxt format.
   */
  public toString(): string {
    const parts: string[] = [];

    if (this.completed) {
      parts.push("x");
      if (this.completionDate) {
        parts.push(this.completionDate);
      }
      if (this.creationDate) {
        parts.push(this.creationDate);
      }
    } else {
      if (this.priority) {
        parts.push(this.priority);
      }
      if (this.creationDate) {
        parts.push(this.creationDate);
      }
    }

    parts.push(this.description);

    // Add projects and contexts separately (not as part of description)
    for (const project of this.projects) {
      if (!parts.includes(project)) {
        parts.push(project);
      }
    }

    for (const context of this.contexts) {
      if (!parts.includes(context)) {
        parts.push(context);
      }
    }

    // Append key-value pairs
    for (const key in this.keyValues) {
      const value = this.keyValues[key];
      if (Array.isArray(value)) {
        parts.push(`${key}:${value.join(",")}`);
      } else {
        parts.push(`${key}:${value}`);
      }
    }

    return parts.join(" ");
  }

  /**
   * Creates a clone of this task.
   * @returns {Task} A new task with the same properties.
   */
  public clone(): Task {
    return new Task({
      completed: this.completed,
      priority: this.priority,
      completionDate: this.completionDate,
      creationDate: this.creationDate,
      description: this.description,
      projects: [...this.projects],
      contexts: [...this.contexts],
      keyValues: { ...this.keyValues },
    });
  }

  /**
   * Gets today's date in YYYY-MM-DD format.
   * @returns {string} Today's date.
   * @private
   */
  private getTodayString(): string {
    return new Date().toISOString().split("T")[0];
  }
}
