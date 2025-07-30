import { type Position, type Reader } from "./Reader"

export interface Token {
  kind: TokenKind;
  value: string;
  start: number;
  next: Position;
}

export const enum TokenKind { }


const is_ident = (c) => /[a-z0-9_-]/i.test(c)

const is_ident_start = (c) => /[a-z_]/i.test(c)

const is_whitespace = (c) => '\t\r\n '.indexOf(c) >= 0


export class Tokenize {
  private readonly tokens: Token[] = [];

  public constructor(private readonly reader: Reader) { }

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
    return this.tokens.shift() || this.read_next()
  }

  public eof() {
    return typeof this.peek() === 'undefined'
  }

  public unexpected(context: string) {
    return this.reader.unexpected(context)
  }

  public read_next() {
    if (this.reader.eof()) return null;
    const c = this.reader.peek();
    // 空白
    if (is_whitespace(c)) return this.read_whitespace();

    // 变量
    if (c === "$") return this.read_variable();

    // @开头关键字
    if (c === "@") return this.read_atkeyword();

    // 普通标识符
    if (is_ident_start(c)) return this.read_ident();
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

  public read_atkeyword() {
    const start = this.reader.position()
    this.reader.next()
    const value = this.read_while(is_ident)
    return this.create('atkeyword', value, start)
  }

  public read_variable() {
    const start = this.reader.position()
    this.reader.next()
    const value = this.read_while(is_ident)
    return this.create('variable', value, start)
  }
}
