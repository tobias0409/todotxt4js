export class Task {
  public id: string;
  public completed: boolean;
  public priority?: string;
  public completionDate?: string;
  public creationDate?: string;
  public description: string;
  public projects: string[];
  public contexts: string[];
  public keyValues: { [key: string]: any };

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

  public setDescription(newDescription: string): void {
    this.description = newDescription;
  }

  public setDueDate(newDueDate: string): void {
    this.keyValues["due"] = newDueDate;
  }

  public markCompleted(completionDate: string): void {
    this.completed = true;
    this.completionDate = completionDate;
  }
}
