export class TaskParsingError extends Error {
  constructor(message: string, public tokenIndex?: number) {
    super(message);
    this.name = "TaskParsingError";
  }
}
