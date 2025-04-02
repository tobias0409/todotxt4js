import { Scanner } from "./Scanner";
import { Parser, ParserOptions } from "./Parser";
import { Task } from "./Task";

export class TodoList {
  tasks: Task[];

  constructor() {
    this.tasks = [];
  }

  /**
   * Parse a multiline todotxt text. Each non-empty line is parsed as a separate task.
   * Throws an error if any task fails to parse.
   */
  public parse(text: string, parserOptions?: ParserOptions): void {
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
    const scanner = new Scanner();
    this.tasks = [];
    for (const line of lines) {
      const tokens = scanner.scan(line);
      const parser = new Parser(tokens, parserOptions);
      const task = parser.parseTask();
      this.tasks.push(task);
    }
  }

  /**
   * Add a new task from a single line.
   */
  public addTask(line: string, parserOptions?: ParserOptions): void {
    const scanner = new Scanner();
    const tokens = scanner.scan(line);
    const parser = new Parser(tokens, parserOptions);
    const task = parser.parseTask();
    this.tasks.push(task);
  }

  /**
   * Edit a task by id using an updater function.
   */
  public editTask(taskId: string, updater: (task: Task) => void): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error(`Task with id ${taskId} not found.`);
    updater(task);
  }

  /**
   * Delete a task by id.
   */
  public deleteTask(taskId: string): void {
    this.tasks = this.tasks.filter((t) => t.id !== taskId);
  }

  /**
   * Convert the todo list back to a string representation.
   * This generates a complete todotxt output.
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
   * Sort tasks by a given criteria
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
