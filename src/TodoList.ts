/**
 * @fileoverview Provides the TodoList class for managing collections of todos.
 * This class handles parsing, adding, editing, and deleting todo.txt todos, along with
 * querying and filtering functionalities.
 * @module TodoList
 */

import { Scanner } from "./Scanner";
import { Parser, ParserOptions } from "./Parser";
import { Todo, RecurrencePattern } from "./Todo";

/**
 * A class representing a collection of todo.txt todos.
 * Provides methods for parsing, managing, and querying todos in the todo.txt format.
 */
export class TodoList {
  /** Array of Todo objects managed by this TodoList */
  todos: Todo[];

  /**
   * Creates a new TodoList instance.
   * @param {string} [text] - Optional todotxt text to parse into todos.
   */
  constructor(text?: string) {
    this.todos = [];

    if (text) {
      this.parse(text);
    }
  }

  /**
   * Parse a multiline todotxt text. Each non-empty line is parsed as a separate todo.
   * Throws an error if any todo fails to parse.
   * @param {string} text - The todotxt formatted string to parse.
   * @param {ParserOptions} [parserOptions] - Optional configuration for the parser.
   */
  public parse(text: string, parserOptions?: ParserOptions): void;

  /**
   * Add multiple todo objects directly to the list.
   * @param {Todo[]} todos - Array of Todo objects to add to the list.
   */
  public parse(todos: Todo[]): void;

  /**
   * Implementation of parse that handles both overloads.
   * @param {string|Todo[]} textOrTodos - Either a todotxt string or an array of Todo objects.
   * @param {ParserOptions} [parserOptions] - Optional configuration for the parser.
   */
  public parse(
    textOrTodos: string | Todo[],
    parserOptions?: ParserOptions
  ): void {
    this.todos = [];

    if (typeof textOrTodos === "string") {
      const lines = textOrTodos
        .split(/\r?\n/)
        .filter((line) => line.trim() !== "");
      const scanner = new Scanner();
      for (const line of lines) {
        const tokens = scanner.scan(line);
        const parser = new Parser(tokens, parserOptions);
        const todo = parser.parseTodo();
        this.todos.push(todo);
      }
    } else {
      // Array of Todo objects
      this.todos = [...textOrTodos];
    }
  }

  /**
   * Returns all todos in the list.
   * @returns {Todo[]} Array of all Todo objects.
   */
  public getTodos(): Todo[] {
    return this.todos;
  }

  /**
   * Get a todo by its position in the todo list (zero-based).
   * @param {number} lineNumber - The line number (0-based index).
   * @returns {Todo|undefined} The todo at the specified position or undefined if out of bounds.
   */
  public getTodoByLineNumber(lineNumber: number): Todo | undefined {
    if (lineNumber < 0 || lineNumber >= this.todos.length) {
      return undefined;
    }
    return this.todos[lineNumber];
  }

  /**
   * Get a specific todo by its unique identifier.
   * @param {string} todoId - The unique identifier of the todo to retrieve.
   * @returns {Todo|undefined} The matching todo or undefined if not found.
   */
  public getTodo(todoId: string): Todo | undefined {
    return this.todos.find((todo) => todo.id === todoId);
  }

  /**
   * Get todos that match a specific property value.
   * @param {keyof Todo} property - The property name to match.
   * @param {any} value - The value to match against.
   * @returns {Todo[]} Array of todos matching the property value.
   */
  public getTodosByProperty<T extends keyof Todo>(
    property: T,
    value: Todo[T]
  ): Todo[] {
    return this.todos.filter((todo) => todo[property] === value);
  }

  /**
   * Get todos that match a specific key-value pair.
   * @param {string} key - The key name to match.
   * @param {any} value - The value to match against.
   * @returns {Todo[]} Array of todos matching the key-value pair.
   */
  public getTodosByKeyValue(key: string, value: any): Todo[] {
    return this.todos.filter((todo) => {
      const todoValue = todo.keyValues[key];
      if (Array.isArray(todoValue)) {
        return todoValue.includes(value);
      } else {
        return todoValue === value;
      }
    });
  }

  /**
   * Get all unique projects used across all todos.
   * @returns {string[]} Array of unique project names.
   */
  public getProjects(): string[] {
    const projects = new Set<string>();

    for (const todo of this.todos) {
      for (const project of todo.projects) {
        projects.add(project);
      }
    }

    return Array.from(projects).sort();
  }

  /**
   * Get all unique contexts used across all todos.
   * @returns {string[]} Array of unique context names.
   */
  public getContexts(): string[] {
    const contexts = new Set<string>();

    for (const todo of this.todos) {
      for (const context of todo.contexts) {
        contexts.add(context);
      }
    }

    return Array.from(contexts).sort();
  }

  /**
   * Get all unique key names used in key-value pairs across all todos.
   * @returns {string[]} Array of unique key names.
   */
  public getKeyNames(): string[] {
    const keys = new Set<string>();

    for (const todo of this.todos) {
      for (const key in todo.keyValues) {
        keys.add(key);
      }
    }

    return Array.from(keys).sort();
  }

  /**
   * Get todos that include a specific context.
   * @param {string} context - The context to search for (without the @ symbol).
   * @returns {Todo[]} Array of todos containing the specified context.
   */
  public getTodosByContext(context: string): Todo[] {
    return this.todos.filter((todo) => todo.contexts.includes(context));
  }

  /**
   * Get todos that include a specific project.
   * @param {string} project - The project to search for (without the + symbol).
   * @returns {Todo[]} Array of todos containing the specified project.
   */
  public getTodosByProject(project: string): Todo[] {
    return this.todos.filter((todo) => todo.projects.includes(project));
  }

  /**
   * Get todos that are marked as completed.
   * @returns {Todo[]} Array of completed todos.
   */
  public getCompletedTodos(): Todo[] {
    return this.todos.filter((todo) => todo.completed);
  }

  /**
   * Get todos that are not marked as completed.
   * @returns {Todo[]} Array of incomplete todos.
   */
  public getIncompleteTodos(): Todo[] {
    return this.todos.filter((todo) => !todo.completed);
  }

  /**
   * Get todos that are due today.
   * @returns {Todo[]} Array of todos due today.
   */
  public getDueTodayTodos(): Todo[] {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    return this.todos.filter((todo) => {
      const dueDate = todo.keyValues["due"];
      return dueDate && dueDate === today;
    });
  }

  /**
   * Get todos that are past their due date and not completed.
   * @returns {Todo[]} Array of overdue todos.
   */
  public getOverdueTodos(): Todo[] {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    return this.todos.filter((todo) => {
      const dueDate = todo.keyValues["due"];
      return dueDate && dueDate < today && !todo.completed;
    });
  }

  /**
   * Get todos that are due within a specified number of days from today.
   * @param {number} n - Number of days from today.
   * @returns {Todo[]} Array of todos due within the specified time period.
   */
  public getDueInNextNDaysTodos(n: number): Todo[] {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + n);
    const futureDateString = futureDate.toISOString().split("T")[0]; // YYYY-MM-DD

    return this.todos.filter((todo) => {
      const dueDate = todo.keyValues["due"];
      return dueDate && dueDate <= futureDateString && !todo.completed;
    });
  }

  /**
   * Add a new todo from a single line of text.
   * @param {string} line - The todotxt formatted line to parse.
   * @param {ParserOptions} [parserOptions] - Optional configuration for the parser.
   */
  public addTodo(line: string, parserOptions?: ParserOptions): void;

  /**
   * Add a todo object directly to the list.
   * @param {Todo} todo - The Todo object to add.
   */
  public addTodo(todo: Todo): void;

  /**
   * Implementation of addTodo that handles both overloads.
   * @param {string|Todo} todoOrLine - Either a todotxt string or a Todo object.
   * @param {ParserOptions} [parserOptions] - Optional configuration for the parser.
   */
  public addTodo(
    todoOrLine: string | Todo,
    parserOptions?: ParserOptions
  ): void {
    if (typeof todoOrLine === "string") {
      // String input - parse it
      const scanner = new Scanner();
      const tokens = scanner.scan(todoOrLine);
      const parser = new Parser(tokens, parserOptions);
      const todo = parser.parseTodo();
      this.todos.push(todo);
    } else {
      // Todo object input - add directly
      this.todos.push(todoOrLine);
    }
  }

  /**
   * Edit a todo by id using an updater function.
   * @param {string} todoId - The unique identifier of the todo to edit.
   * @param {function} updater - Function that modifies the todo object.
   * @throws {Error} If the todo with the specified ID is not found.
   */
  public editTodo(todoId: string, updater: (todo: Todo) => void): void;

  /**
   * Edit a todo by providing a todo object with the same ID.
   * @param {Todo} updatedTodo - The modified Todo object with the same ID as the todo to replace.
   * @throws {Error} If the todo with the specified ID is not found.
   */
  public editTodo(updatedTodo: Todo): void;

  /**
   * Implementation of editTodo that handles both overloads.
   * @param {string|Todo} todoIdOrTodo - Either a todo ID or a Todo object.
   * @param {function} [updater] - Function that modifies the todo object.
   * @throws {Error} If the todo with the specified ID is not found.
   */
  public editTodo(
    todoIdOrTodo: string | Todo,
    updater?: (todo: Todo) => void
  ): void {
    if (typeof todoIdOrTodo === "string") {
      // String todoId input
      const todo = this.todos.find((t) => t.id === todoIdOrTodo);
      if (!todo) throw new Error(`Todo with id ${todoIdOrTodo} not found.`);
      updater!(todo);
    } else {
      // Todo object input
      const index = this.todos.findIndex((t) => t.id === todoIdOrTodo.id);
      if (index === -1)
        throw new Error(`Todo with id ${todoIdOrTodo.id} not found.`);
      this.todos[index] = todoIdOrTodo;
    }
  }

  /**
   * Delete a todo by id.
   * @param {string} todoId - The unique identifier of the todo to delete.
   */
  public deleteTodo(todoId: string): void;

  /**
   * Delete a todo by object reference.
   * @param {Todo} todo - The Todo object to delete.
   */
  public deleteTodo(todo: Todo): void;

  /**
   * Implementation of deleteTodo that handles both overloads.
   * @param {string|Todo} todoIdOrTodo - Either a todo ID or a Todo object.
   */
  public deleteTodo(todoIdOrTodo: string | Todo): void {
    if (typeof todoIdOrTodo === "string") {
      // String todoId input
      this.todos = this.todos.filter((t) => t.id !== todoIdOrTodo);
    } else {
      // Todo object input
      this.todos = this.todos.filter((t) => t.id !== todoIdOrTodo.id);
    }
  }

  /**
   * Convert the todo list back to a string representation.
   * This generates a complete todotxt output with one todo per line.
   * @returns {string} The string representation of all todos.
   */
  public toString(): string {
    return this.todos
      .map((todo) => {
        return todo.toString();
      })
      .join("\n");
  }

  /**
   * Sort todos by a given criteria.
   * @param {string} criteria - The criteria to sort by: "priority", "due", "creation", or "completion".
   */
  public sortBy(
    criteria: "priority" | "due" | "creation" | "completion"
  ): void {
    this.todos.sort((a, b) => {
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
   * Filter todos based on multiple criteria.
   * @param {Object} criteria - An object containing filter criteria.
   * @param {boolean} [criteria.completed] - Whether to include completed todos.
   * @param {string} [criteria.priority] - Filter by priority.
   * @param {string[]} [criteria.projects] - Filter by project names.
   * @param {string[]} [criteria.contexts] - Filter by context names.
   * @param {string} [criteria.dueAfter] - Include todos due after this date (YYYY-MM-DD).
   * @param {string} [criteria.dueBefore] - Include todos due before this date (YYYY-MM-DD).
   * @returns {Todo[]} Array of todos matching all specified criteria.
   */
  public filter(criteria: {
    completed?: boolean;
    priority?: string;
    projects?: string[];
    contexts?: string[];
    dueAfter?: string;
    dueBefore?: string;
  }): Todo[] {
    return this.todos.filter((todo) => {
      if (
        criteria.completed !== undefined &&
        todo.completed !== criteria.completed
      )
        return false;
      if (criteria.priority && todo.priority !== criteria.priority)
        return false;

      if (criteria.projects && criteria.projects.length > 0) {
        if (
          !criteria.projects.some((project) => todo.projects.includes(project))
        )
          return false;
      }

      if (criteria.contexts && criteria.contexts.length > 0) {
        if (
          !criteria.contexts.some((context) => todo.contexts.includes(context))
        )
          return false;
      }

      const dueDate = todo.keyValues["due"];
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
