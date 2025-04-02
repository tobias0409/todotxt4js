import { Token, TokenType } from "./Token";

export class Scanner {
  // Define token patterns in order of priority.
  private tokenDefinitions: { type: TokenType; regex: RegExp }[] = [
    { type: TokenType.COMPLETION, regex: /^x$/ },
    // PRIORITY is included here, but we override its type if not in an allowed position.
    { type: TokenType.PRIORITY, regex: /^\([A-Z]\)$/ },
    { type: TokenType.DATE, regex: /^\d{4}-\d{2}-\d{2}$/ },
    { type: TokenType.PROJECT, regex: /^\+[^\s]+$/ },
    { type: TokenType.CONTEXT, regex: /^@[^\s]+$/ },
    { type: TokenType.KEY, regex: /^[A-Za-z]+:$/ },
  ];

  public scan(line: string): Token[] {
    const tokens: Token[] = [];
    // Split the line on whitespace.
    const parts = line.split(/\s+/).filter((part) => part.length > 0);

    // Regex to capture combined key-value pairs (e.g., "due:2021-01-01")
    const keyValueRegex = /^([A-Za-z]+:)(\S+)$/;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      // Check for combined key-value pair first.
      const keyValueMatch = keyValueRegex.exec(part);
      if (keyValueMatch) {
        tokens.push(new Token(TokenType.KEY, keyValueMatch[1]));
        let valueToken: Token | null = null;
        for (const def of this.tokenDefinitions) {
          if (def.regex.test(keyValueMatch[2])) {
            valueToken = new Token(def.type, keyValueMatch[2]);
            break;
          }
        }
        if (!valueToken) {
          valueToken = new Token(TokenType.WORD, keyValueMatch[2]);
        }
        tokens.push(valueToken);
        continue; // Skip further processing for this part.
      }

      // Special-case for PRIORITY: it must be in an allowed position.
      // Allowed if:
      //   - it's the first token (i === 0), or
      //   - it's the second token (i === 1) and the first token is a COMPLETION marker ("x")
      if (/^\([A-Z]\)$/.test(part)) {
        if (!(i === 0 || (i === 1 && parts[0] === "x"))) {
          tokens.push(new Token(TokenType.WORD, part));
          continue;
        }
      }

      // Otherwise, try to match using our token definitions.
      let token: Token | null = null;
      for (const def of this.tokenDefinitions) {
        if (def.regex.test(part)) {
          token = new Token(def.type, part);
          break;
        }
      }
      // Fallback to WORD if no definition matches.
      if (!token) {
        token = new Token(TokenType.WORD, part);
      }
      tokens.push(token);
    }
    return tokens;
  }
}
