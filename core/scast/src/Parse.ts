import { type Position } from "./Reader"

export const enum Code { }

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

export class Parse {
  public constructor(public readonly tokens) { }

  public create(type, value, start?: Position, next?: Position) {
    return { type, value, start, next }
  }

  public stylesheet() {
    const value = []
    this.tokens.peek()
   
    console.log(this.tokens)

    return this.create('stylesheet', value)
  }

  public node() {
    const value = []

    while (!this.tokens.eof()) { }

    return value
  }

  private is_type(type, ...values) {
    const t = this.tokens.peek()
    if (!values.length) return t ? type.test(t.type) : false;
    return values.reduce((a, c, i) => {
      const t = this.tokens.peek(i)
      return !t ? false : a && type.test(t.type) && t.value === c
    }, true)
  }
}
