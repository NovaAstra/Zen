export interface Position {
  offset: number;
  row: number;
  col: number;
}

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

  public next() {
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

export class Tokenize {
  public tokens = [];

  public create(type, value, start) {
    return Object.freeze({
      type,
      value,
      start,
    })
  }

  public peek(offset: number = 0) {
    if (!this.tokens.length) {

    }

    return this.tokens[offset]
  }

  public next() {
    const token = this.tokens.shift()
    return token
  }

  public eof() {
    return typeof this.peek() === 'undefined'
  }
}