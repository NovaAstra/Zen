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

const is_digit = (c) => /[0-9]/i.test(c)

const is_number_start = (input) =>
  is_digit(input.peek()) || (input.peek() === '.' && is_digit(input.peek(1)))


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

    if (is_number_start(this.reader)) {
      return this.read_number()
    }

    if (c === '"' || c === '\'') {
      return this.read_string(c)
    }

    // 普通标识符
    if (is_ident_start(c)) return this.read_ident();

    // 变量
    if (c === "$") return this.read_variable();

    // @开头关键字
    if (c === "@") return this.read_atkeyword();


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

  public read_escaped(end) {
    let escaped = false
    let str = ''
    this.reader.next()
    while (!this.reader.eof()) {
      const c = this.reader.next()
      if (escaped) {
        str += c
        escaped = false
      } else if (c === '\\') {
        str += c
        escaped = true
      } else if (c === end) {
        break
      } else {
        str += c
      }
    }
    return str
  }

  public read_string(c) {
    const start = this.reader.position()
    const value = this.read_escaped(c)
    let type = 'string'
    if (c === '"') type = 'string_double'
    if (c === '\'') type = 'string_single'
    return this.create(type, value, start)
  }

  public read_number() {
    const start = this.reader.position()
    let hasPoint = false
    const value = this.read_while((c) => {
      if (c === '.') {
        if (hasPoint) return false
        hasPoint = true
        return true
      }
      return is_digit(c)
    })
    return this.create('number', value, start)
  }
}
