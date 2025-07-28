export const enum Code {

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