export enum TokenType {
  COMPLETION, // "x"
  PRIORITY, // "(A)" - "(Z)""
  DATE, // "YYYY-MM-DD"
  PROJECT, // e.g., "+Project"
  CONTEXT, // e.g., "@context"
  KEY, // e.g., "due:" (key ending with a colon)
  WORD, // Any other word (fallback)
}

export class Token {
  constructor(public type: TokenType, public value: string) {}
}
