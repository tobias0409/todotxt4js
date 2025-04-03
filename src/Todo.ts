/**
 * @fileoverview Provides the Todo class representing a single todo.txt todo.
 * Todos encapsulate the properties of a todo.txt item including completion status,
 * priority, dates, projects, contexts, and key-value pairs.
 * @module Todo
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
 * Class representing a single todo in the todo.txt format.
 * A todo includes completion status, priority, dates, descriptions,
 * and metadata like projects, contexts, and key-value pairs.
 */
export class Todo {
  /** Unique identifier for the todo */
  public id: string;

  /** Whether the todo is marked as completed */
  public completed: boolean;

  /** Priority of the todo, in the format "(A)" through "(Z)" */
  public priority?: string;

  /** Completion date in YYYY-MM-DD format */
  public completionDate?: string;

  /** Creation date in YYYY-MM-DD format */
  public creationDate?: string;

  /** Main text description of the todo */
  public description: string;

  /** Array of project tags (starting with +) */
  public projects: string[];

  /** Array of context tags (starting with @) */
  public contexts: string[];

  /** Object storing key-value pairs as metadata */
  public keyValues: { [key: string]: any };

  /**
   * Creates a new Todo instance.
   * @param {Object} [options] - Optional configuration for the new todo.
   * @param {boolean} [options.completed] - Whether the todo is completed.
   * @param {string} [options.priority] - The priority of the todo (A-Z or in format "(A)").
   * @param {string} [options.completionDate] - When the todo was completed.
   * @param {string} [options.creationDate] - When the todo was created.
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
      // Convenience parameters
      project?: string;
      context?: string;
      due?: string;
      [key: string]: any;
    } = {}
  ) {
    this.id = crypto.randomUUID();
    this.completed = options.completed || false;

    // Handle priority: normalize to form "(X)"
    if (options.priority) {
      if (options.priority.startsWith("(") && options.priority.endsWith(")")) {
        // Priority is already enclosed in parentheses
        const priorityChar = options.priority.charAt(1).toUpperCase();
        if (/[A-Z]/.test(priorityChar)) {
          this.priority = `(${priorityChar})`;
        }
      } else {
        // Just a letter (possibly with other characters)
        const priorityChar = options.priority
          .replace(/[^A-Za-z]/, "")
          .toUpperCase();
        if (priorityChar) {
          this.priority = `(${priorityChar})`;
        }
      }
    }

    this.completionDate = options.completionDate;
    this.creationDate = options.creationDate;
    this.description = options.description || "";

    // Initialize empty arrays and objects
    this.projects = options.projects || [];
    this.contexts = options.contexts || [];
    this.keyValues = options.keyValues || {};

    // Handle convenience parameters
    if (options.project) {
      this.addProject(options.project);
    }

    if (options.context) {
      this.addContext(options.context);
    }

    if (options.due) {
      this.setDueDate(options.due);
    }

    // Handle any additional key-value pairs from options
    for (const key in options) {
      if (
        ![
          "completed",
          "priority",
          "completionDate",
          "creationDate",
          "description",
          "projects",
          "contexts",
          "keyValues",
          "project",
          "context",
          "due",
          "id",
        ].includes(key)
      ) {
        this.setKeyValue(key, options[key]);
      }
    }
  }

  /**
   * Sets the description text of the todo.
   * @param {string} newDescription - The new description text.
   */
  public setDescription(newDescription: string): void {
    this.description = newDescription;
  }

  /**
   * Sets the due date for the todo.
   * @param {string} dueDate - The due date in YYYY-MM-DD format.
   */
  public setDueDate(dueDate: string): void {
    this.keyValues["due"] = dueDate;
  }

  /**
   * Gets the due date of the todo, if any.
   * @returns {string|undefined} The due date in YYYY-MM-DD format or undefined.
   */
  public getDueDate(): string | undefined {
    return this.keyValues["due"];
  }

  /**
   * Checks if the todo is due today.
   * @returns {boolean} True if the todo is due today.
   */
  public isDueToday(): boolean {
    const dueDate = this.keyValues["due"];
    return dueDate === this.getTodayString();
  }

  /**
   * Checks if the todo is overdue.
   * @returns {boolean} True if the todo is overdue and not completed.
   */
  public isOverdue(): boolean {
    const dueDate = this.keyValues["due"];
    return !this.completed && !!dueDate && dueDate < this.getTodayString();
  }

  /**
   * Calculates the number of days until the todo is due.
   * @returns {number|undefined} Number of days, or undefined if no due date.
   */
  public daysUntilDue(): number | undefined {
    const dueDate = this.keyValues["due"];
    if (!dueDate) return undefined;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Marks the todo as completed.
   * @param {string} [completionDate] - Optional completion date in YYYY-MM-DD format.
   *                                   Defaults to today if not provided.
   */
  public markCompleted(completionDate?: string): void {
    this.completed = true;
    this.completionDate = completionDate || this.getTodayString();
  }

  /**
   * Marks the todo as incomplete, removing any completion date.
   */
  public markIncomplete(): void {
    this.completed = false;
    this.completionDate = undefined;
  }

  /**
   * Toggles completion status of the todo.
   * @returns {boolean} The new completion status.
   */
  public toggleCompletion(): boolean {
    if (this.completed) {
      this.markIncomplete();
      return false;
    } else {
      this.markCompleted();
      return true;
    }
  }

  /**
   * Adds a context tag to the todo.
   * @param {string} context - Context tag to add (with or without the @ symbol).
   */
  public addContext(context: string): void {
    const formattedContext = context.startsWith("@") ? context : `@${context}`;
    if (!this.contexts.includes(formattedContext)) {
      this.contexts.push(formattedContext);
    }
  }

  /**
   * Removes a context tag from the todo.
   * @param {string} context - Context tag to remove (with or without the @ symbol).
   */
  public removeContext(context: string): void {
    const formattedContext = context.startsWith("@") ? context : `@${context}`;
    this.contexts = this.contexts.filter((c) => c !== formattedContext);
  }

  /**
   * Adds a project tag to the todo.
   * @param {string} project - Project tag to add (with or without the + symbol).
   */
  public addProject(project: string): void {
    const formattedProject = project.startsWith("+") ? project : `+${project}`;
    if (!this.projects.includes(formattedProject)) {
      this.projects.push(formattedProject);
    }
  }

  /**
   * Removes a project tag from the todo.
   * @param {string} project - Project tag to remove (with or without the + symbol).
   */
  public removeProject(project: string): void {
    const formattedProject = project.startsWith("+") ? project : `+${project}`;
    this.projects = this.projects.filter((p) => p !== formattedProject);
  }

  /**
   * Sets the priority of the todo.
   * @param {string|null} priority - Priority letter (A-Z) or null to remove priority.
   */
  public setPriority(priority: string | null): void {
    if (priority === null) {
      this.priority = undefined;
      return;
    }

    if (priority.startsWith("(") && priority.endsWith(")")) {
      // Priority is already enclosed in parentheses
      const priorityChar = priority.charAt(1).toUpperCase();
      if (/[A-Z]/.test(priorityChar)) {
        this.priority = `(${priorityChar})`;
      }
    } else {
      // Just extract the letter
      const priorityChar = priority.replace(/[^A-Za-z]/, "").toUpperCase();
      if (priorityChar) {
        this.priority = `(${priorityChar})`;
      }
    }
  }

  /**
   * Increases priority by one level (e.g., B -> A).
   * If the todo has no priority, sets it to (Z).
   */
  public increasePriority(): void {
    if (!this.priority) {
      this.setPriority("Z");
      return;
    }

    const currentPriority = this.priority.charAt(1);
    if (currentPriority === "A") return;

    const newPriority = String.fromCharCode(currentPriority.charCodeAt(0) - 1);
    this.setPriority(newPriority);
  }

  /**
   * Decreases priority by one level (e.g., A -> B).
   * If the priority is already Z, removes the priority.
   */
  public decreasePriority(): void {
    if (!this.priority) return;

    const currentPriority = this.priority.charAt(1);
    if (currentPriority === "Z") {
      this.setPriority(null);
      return;
    }

    const newPriority = String.fromCharCode(currentPriority.charCodeAt(0) + 1);
    this.setPriority(newPriority);
  }

  /**
   * Sets a key-value pair on the todo.
   * @param {string} key - The key name.
   * @param {any} value - The value to store.
   */
  public setKeyValue(key: string, value: any): void {
    this.keyValues[key] = value;
  }

  /**
   * Removes a key-value pair from the todo.
   * @param {string} key - The key name to remove.
   */
  public removeKeyValue(key: string): void {
    delete this.keyValues[key];
  }

  /**
   * Sets a recurrence pattern for the todo.
   * @param {RecurrencePattern} pattern - The recurrence pattern configuration.
   */
  public setRecurrence(pattern: RecurrencePattern): void {
    const value = `${pattern.interval}${pattern.type.charAt(0)}`;
    this.setKeyValue("rec", value);
  }

  /**
   * Gets the recurrence pattern of the todo, if any.
   * @returns {RecurrencePattern|undefined} The recurrence pattern or undefined.
   */
  public getRecurrence(): RecurrencePattern | undefined {
    const value = this.keyValues["rec"];
    if (!value || typeof value !== "string") return undefined;

    const match = value.match(/^(\d+)([dwmy])$/i);
    if (!match) return undefined;

    const interval = parseInt(match[1]);
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
   * Generates a new todo based on the recurrence pattern.
   * @returns {Todo|undefined} A new todo with updated due date, or undefined if not recurring.
   */
  public generateRecurringTodo(): Todo | undefined {
    const dueDate = this.getDueDate();
    const recurrence = this.getRecurrence();

    if (!dueDate || !recurrence) return undefined;

    const newTodo = this.clone();
    newTodo.completed = false;
    newTodo.completionDate = undefined;

    // Calculate new due date
    const date = new Date(dueDate);
    switch (recurrence.type) {
      case "daily":
        date.setDate(date.getDate() + recurrence.interval);
        break;
      case "weekly":
        date.setDate(date.getDate() + recurrence.interval * 7);
        break;
      case "monthly":
        date.setMonth(date.getMonth() + recurrence.interval);
        break;
      case "yearly":
        date.setFullYear(date.getFullYear() + recurrence.interval);
        break;
    }

    const newDueDate = date.toISOString().split("T")[0];
    newTodo.setDueDate(newDueDate);

    return newTodo;
  }

  /**
   * Converts the todo to its string representation.
   * @returns {string} The todo in todo.txt format.
   */
  public toString(): string {
    const parts: string[] = [];

    // Completion marker and completion date
    if (this.completed) {
      parts.push("x");
      if (this.completionDate) {
        parts.push(this.completionDate);
      }
    }

    // Creation date (if present)
    if (this.creationDate) {
      parts.push(this.creationDate);
    }

    // Priority (only for incomplete todos or after dates for completed todos)
    if (this.priority && !this.completed) {
      // For todo.txt format, priority only appears for incomplete todos
      parts.push(this.priority);
    }

    // Description text
    parts.push(this.description);

    // Add projects and contexts if they're not already in the description
    for (const project of this.projects) {
      if (!this.description.includes(project)) {
        parts.push(project);
      }
    }

    for (const context of this.contexts) {
      if (!this.description.includes(context)) {
        parts.push(context);
      }
    }

    // Add key-value pairs
    for (const key in this.keyValues) {
      if (Object.prototype.hasOwnProperty.call(this.keyValues, key)) {
        parts.push(`${key}:${this.keyValues[key]}`);
      }
    }

    return parts.join(" ");
  }

  /**
   * Creates a deep copy of this todo.
   * @returns {Todo} A new todo with the same properties.
   */
  public clone(): Todo {
    return new Todo({
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
   * Gets today's date as a YYYY-MM-DD string.
   * @returns {string} Today's date.
   * @private
   */
  private getTodayString(): string {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }
}
