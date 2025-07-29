export interface Position {
  offset: number;
  row: number;
  col: number;
}

export interface Token {
  kind: TokenKind;
  value: string;
  start: number;
  next: Position;
}

export const enum TokenKind { }

export const enum Code {

}

export class Reader {
  private readonly input: string = '';

  private get length(): number {
    return this.input.length
  }

  private offset: number = 0
  private row: number = 1
  private col: number = 0

  public constructor(input: string) {
    this.input = input;
  }

  public position(): Readonly<Position> {
    return Object.freeze({
      offset: this.offset,
      row: this.row,
      col: this.col
    })
  }

  public peek(ahead: number = 0): string {
    const pos = this.offset + ahead
    return this.input.charAt(pos)
  }

  public next(): string {
    const code = this.input.charAt(this.offset++)
    if (code === '\n') {
      this.row++
      this.col = 0
    } else {
      this.col++
    }
    return code
  }

  public eof(): boolean {
    return this.offset >= this.length
  }

  public unexpected(context: string): never {
    const code = this.input.charAt(this.offset)
    const pointer = ' '.repeat(this.col) + '^'

    const message = [
      `Unexpected token "${this.visualize(code)}" while parsing ${context}`,
      `→ at line ${this.row}, column ${this.col}`,
      this.line(),
      pointer,
    ].join('\n')

    throw new SyntaxError(message)
  }

  private line(): string {
    const start = this.input.lastIndexOf('\n', this.offset - 1) + 1;
    const end = this.input.indexOf('\n', this.offset);
    return this.input.slice(start, end === -1 ? this.length : end);
  }

  private visualize(char: string): string {
    switch (char) {
      case '\n': return '\\n';
      case '\r': return '\\r';
      case '\t': return '\\t';
      case '': return '<EOF>';
      default: return char;
    }
  }
}

export class Unicode {
  public static isWhitespace(c: string): boolean {
    return c === ' ' || c === '\t' || c === '\r' || c === '\n';
  }

  public static isNewline(c: string): boolean {
    return c === '\n';
  }

  public static isOperator(c: string): boolean {
    return '+-*/%=&|!~><^'.indexOf(c) >= 0
  }
}

const is_ident = (c) => /[a-z0-9_-]/i.test(c)

const is_ident_start = (c) => /[a-z_]/i.test(c)

const is_whitespace = (c) => '\t\r\n '.indexOf(c) >= 0

export class Tokenize {
  public readonly tokens: Token[] = [];

  public constructor(public readonly reader: Reader) { }

  public create(kind, value, start) {
    return Object.freeze({
      kind,
      value,
      start,
      next: this.reader.position()
    })
  }

  public peek(offset: number = 0) {
    if (!this.tokens.length) {
      const token = this.read_next()
      if (token) this.tokens.push(token)
    }
    if (!offset) return this.tokens[0]
    if (offset < this.tokens.length) return this.tokens[offset]
    while (this.tokens.length <= offset) {
      const token = this.read_next()
      if (token) this.tokens.push(token)
      else break
    }
    return this.tokens[offset]
  }

  public next() {
    const token = this.tokens.shift()
    return token || this.read_next()
  }

  public read_next() {
    if (this.reader.eof()) return null;
    const c = this.reader.peek();
    if (is_whitespace(c)) {
      return this.read_whitespace()
    }
    if (is_ident_start(c)) {
      return this.read_ident()
    }

    if (c === '$') {
      return this.read_variable()
    }
  }

  public read_ident() {
    const start = this.reader.position()
    const value = this.read_while(is_ident)
    return this.create('identifier', value, start)
  }

  public read_whitespace() {
    const start = this.reader.position()
    const value = this.read_while(is_whitespace)
    return this.create('space', value, start)
  }

  public read_while(predicate) {
    let s = ''
    while (!this.reader.eof() && predicate(this.reader.peek())) {
      s += this.reader.next()
    }
    return s
  }

  public read_variable() {
    const start = this.reader.position()
    this.reader.next()
    const value = this.read_while(is_ident)
    return this.create('variable', value, start)
  }
}

export class Parse {
  public constructor(tokens) { }

  public stylesheet() {

  }

  public node() { }
}