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
  private _id: string;

  /** Whether the todo is marked as completed */
  private _completed: boolean;

  /** Priority of the todo, in the format "(A)" through "(Z)" */
  private _priority?: string;

  /** Completion date in YYYY-MM-DD format */
  private _completionDate?: string;

  /** Creation date in YYYY-MM-DD format */
  private _creationDate?: string;

  /** Main text description of the todo */
  private _description: string;

  /** Array of project tags (starting with +) */
  private _projects: string[];

  /** Array of context tags (starting with @) */
  private _contexts: string[];

  /** Object storing key-value pairs as metadata */
  private _keyValues: { [key: string]: any };

  /**
   * Creates a new Todo instance.
   * @param {Object} [options] - Optional configuration for the new todo.
   * @param {boolean} [options.completed] - Whether the todo is completed.
   * @param {string} [options.priority] - The priority of the todo (A-Z or in format "(A)").
   * @param {string} [options.completionDate] - When the todo was completed.
   * @param {string} [options.creationDate] - When the todo was created.
   * @param {string} [options.description] - The description text.
   * @param {string[]} [options.projects] - Array of project tags starting with "+".
   * @param {string[]} [options.contexts] - Array of context tags starting with "@".
   * @param {Object} [options.keyValues] - Key-value metadata.
   * @param {string} [options.due] - Due date in YYYY-MM-DD format.
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
      due?: string;
      [key: string]: any;
    } = {}
  ) {
    // Generate a unique ID
    if (
      typeof window !== "undefined" &&
      window.crypto &&
      window.crypto.randomUUID
    ) {
      this._id = window.crypto.randomUUID();
    } else if (
      globalThis.crypto &&
      typeof globalThis.crypto.randomUUID === "function"
    ) {
      this._id = globalThis.crypto.randomUUID();
    } else {
      // Fallback (should not occur in supported environments)
      this._id = Math.random().toString(36).substring(2, 9);
    }

    this._completed = options.completed || false;
    this._description = options.description || "";
    this._completionDate = options.completionDate;
    this._creationDate = options.creationDate;

    // Initialize empty arrays and objects
    this._projects = [];
    this._contexts = [];
    this._keyValues = options.keyValues || {};

    // Format projects with + prefix if needed
    if (options.projects && options.projects.length > 0) {
      for (const project of options.projects) {
        this.addProject(project);
      }
    }

    // Format contexts with @ prefix if needed
    if (options.contexts && options.contexts.length > 0) {
      for (const context of options.contexts) {
        this.addContext(context);
      }
    }

    // Handle priority: normalize to form "(X)"
    if (options.priority) {
      this.setPriority(options.priority);
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
          "due",
          "id",
        ].includes(key)
      ) {
        this.setKeyValue(key, options[key]);
      }
    }
  }

  //
  // Getters
  //

  /** Get the unique identifier */
  get id(): string {
    return this._id;
  }

  /** Get completed status */
  get completed(): boolean {
    return this._completed;
  }

  /** Get priority */
  get priority(): string | undefined {
    return this._priority;
  }

  /** Get completion date */
  get completionDate(): string | undefined {
    return this._completionDate;
  }

  /** Get creation date */
  get creationDate(): string | undefined {
    return this._creationDate;
  }

  /** Get description */
  get description(): string {
    return this._description;
  }

  /** Get projects */
  get projects(): readonly string[] {
    return [...this._projects];
  }

  /** Get contexts */
  get contexts(): readonly string[] {
    return [...this._contexts];
  }

  /** Get key-value pairs */
  get keyValues(): Readonly<{ [key: string]: any }> {
    return { ...this._keyValues };
  }

  /**
   * Gets the due date of the todo, if any.
   * @returns {string|undefined} The due date in YYYY-MM-DD format or undefined.
   */
  getDueDate(): string | undefined {
    return this._keyValues["due"];
  }

  /**
   * Gets the recurrence pattern of the todo, if any.
   * @returns {RecurrencePattern|undefined} The recurrence pattern or undefined.
   */
  getRecurrence(): RecurrencePattern | undefined {
    const value = this._keyValues["rec"];
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

  //
  // Setters
  //

  /** Set completed status */
  set completed(value: boolean) {
    this._completed = value;
    if (!value) {
      this._completionDate = undefined;
    }
  }

  /** Set the completion date */
  set completionDate(value: string | undefined) {
    this._completionDate = value;
  }

  /** Set the creation date */
  set creationDate(value: string | undefined) {
    this._creationDate = value;
  }

  /**
   * Sets the description text of the todo.
   * @param {string} newDescription - The new description text.
   */
  setDescription(newDescription: string): void {
    this._description = newDescription;
  }

  /**
   * Sets the due date for the todo.
   * @param {string} dueDate - The due date in YYYY-MM-DD format.
   */
  setDueDate(dueDate: string): void {
    this._keyValues["due"] = dueDate;
  }

  /**
   * Sets the priority of the todo.
   * @param {string|null} priority - Priority letter (A-Z) or null to remove priority.
   */
  setPriority(priority: string | null): void {
    if (priority === null) {
      this._priority = undefined;
      return;
    }

    if (priority.startsWith("(") && priority.endsWith(")")) {
      // Priority is already enclosed in parentheses
      const priorityChar = priority.charAt(1).toUpperCase();
      if (/[A-Z]/.test(priorityChar)) {
        this._priority = `(${priorityChar})`;
      }
    } else {
      // Just extract the letter
      const priorityChar = priority.replace(/[^A-Za-z]/, "").toUpperCase();
      if (priorityChar) {
        this._priority = `(${priorityChar})`;
      }
    }
  }

  /**
   * Sets a key-value pair on the todo.
   * @param {string} key - The key name.
   * @param {any} value - The value to store.
   */
  setKeyValue(key: string, value: any): void {
    this._keyValues[key] = value;
  }

  /**
   * Sets a recurrence pattern for the todo.
   * @param {RecurrencePattern} pattern - The recurrence pattern configuration.
   */
  setRecurrence(pattern: RecurrencePattern): void {
    const value = `${pattern.interval}${pattern.type.charAt(0)}`;
    this.setKeyValue("rec", value);
  }

  //
  // Other methods
  //

  /**
   * Checks if the todo is due today.
   * @returns {boolean} True if the todo is due today.
   */
  isDueToday(): boolean {
    const dueDate = this._keyValues["due"];
    return dueDate === this.getTodayString();
  }

  /**
   * Checks if the todo is overdue.
   * @returns {boolean} True if the todo is overdue and not completed.
   */
  isOverdue(): boolean {
    const dueDate = this._keyValues["due"];
    return !this._completed && !!dueDate && dueDate < this.getTodayString();
  }

  /**
   * Calculates the number of days until the todo is due.
   * @returns {number|undefined} Number of days, or undefined if no due date.
   */
  daysUntilDue(): number | undefined {
    const dueDate = this._keyValues["due"];
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
   * Defaults to today if not provided.
   */
  markCompleted(completionDate?: string): void {
    this._completed = true;
    this._completionDate = completionDate || this.getTodayString();
  }

  /**
   * Marks the todo as incomplete, removing any completion date.
   */
  markIncomplete(): void {
    this._completed = false;
    this._completionDate = undefined;
  }

  /**
   * Toggles completion status of the todo.
   * @returns {boolean} The new completion status.
   */
  toggleCompletion(): boolean {
    if (this._completed) {
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
  addContext(context: string): void {
    const formattedContext = context.startsWith("@") ? context : `@${context}`;
    if (!this._contexts.includes(formattedContext)) {
      this._contexts.push(formattedContext);
    }
  }

  /**
   * Removes a context tag from the todo.
   * @param {string} context - Context tag to remove (with or without the @ symbol).
   */
  removeContext(context: string): void {
    const formattedContext = context.startsWith("@") ? context : `@${context}`;
    this._contexts = this._contexts.filter((c) => c !== formattedContext);
  }

  /**
   * Adds a project tag to the todo.
   * @param {string} project - Project tag to add (with or without the + symbol).
   */
  addProject(project: string): void {
    const formattedProject = project.startsWith("+") ? project : `+${project}`;
    if (!this._projects.includes(formattedProject)) {
      this._projects.push(formattedProject);
    }
  }

  /**
   * Removes a project tag from the todo.
   * @param {string} project - Project tag to remove (with or without the + symbol).
   */
  removeProject(project: string): void {
    const formattedProject = project.startsWith("+") ? project : `+${project}`;
    this._projects = this._projects.filter((p) => p !== formattedProject);
  }

  /**
   * Increases priority by one level (e.g., B -> A).
   * If the todo has no priority, sets it to (Z).
   */
  increasePriority(): void {
    if (!this._priority) {
      this.setPriority("Z");
      return;
    }

    const currentPriority = this._priority.charAt(1);
    if (currentPriority === "A") return;

    const newPriority = String.fromCharCode(currentPriority.charCodeAt(0) - 1);
    this.setPriority(newPriority);
  }

  /**
   * Decreases priority by one level (e.g., A -> B).
   * If the priority is already Z, removes the priority.
   */
  decreasePriority(): void {
    if (!this._priority) return;

    const currentPriority = this._priority.charAt(1);
    if (currentPriority === "Z") {
      this.setPriority(null);
      return;
    }

    const newPriority = String.fromCharCode(currentPriority.charCodeAt(0) + 1);
    this.setPriority(newPriority);
  }

  /**
   * Removes a key-value pair from the todo.
   * @param {string} key - The key name to remove.
   */
  removeKeyValue(key: string): void {
    delete this._keyValues[key];
  }

  /**
   * Generates a new todo based on the recurrence pattern.
   * @returns {Todo|undefined} A new todo with updated due date, or undefined if not recurring.
   */
  generateRecurringTodo(): Todo | undefined {
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
  toString(): string {
    const parts: string[] = [];

    // Completion marker and completion date
    if (this._completed) {
      parts.push("x");
      if (this._completionDate) {
        parts.push(this._completionDate);
      }
    }

    // Creation date (if present)
    if (this._creationDate) {
      parts.push(this._creationDate);
    }

    // Priority (only for incomplete todos or after dates for completed todos)
    if (this._priority && !this._completed) {
      // For todo.txt format, priority only appears for incomplete todos
      parts.push(this._priority);
    }

    // Description text
    parts.push(this._description);

    // Add projects and contexts if they're not already in the description
    for (const project of this._projects) {
      if (!this._description.includes(project)) {
        parts.push(project);
      }
    }

    for (const context of this._contexts) {
      if (!this._description.includes(context)) {
        parts.push(context);
      }
    }

    // Add key-value pairs
    for (const key in this._keyValues) {
      if (Object.prototype.hasOwnProperty.call(this._keyValues, key)) {
        parts.push(`${key}:${this._keyValues[key]}`);
      }
    }

    return parts.join(" ");
  }

  /**
   * Creates a deep copy of this todo.
   * @returns {Todo} A new todo with the same properties.
   */
  clone(): Todo {
    return new Todo({
      completed: this._completed,
      priority: this._priority,
      completionDate: this._completionDate,
      creationDate: this._creationDate,
      description: this._description,
      projects: [...this._projects],
      contexts: [...this._contexts],
      keyValues: { ...this._keyValues },
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
