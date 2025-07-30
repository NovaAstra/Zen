export interface Position {
  pos: number;
  row: number;
  col: number;
}

/**
 * Reader 类用于逐字符读取字符串，同时跟踪当前读取的位置（行、列、偏移量）
 * 可用于词法分析、解析器等场景
 */
export class Reader {
  private pos: number = 0
  private row: number = 1
  private col: number = 0

  public constructor(private readonly input: string) { }

  private get length(): number {
    return this.input.length
  }

  /**
   * 获取当前读取位置（不可变对象）
   */
  public position(): Readonly<Position> {
    return Object.freeze({
      pos: this.pos,
      row: this.row,
      col: this.col,
    });
  }

  /**
   * 预读字符（不移动指针）
   * @param ahead 向前查看的字符数（默认 0，即当前字符）
   */
  public peek(ahead: number = 0): string {
    return this.input.charAt(this.pos + ahead);
  }

  /**
   * 读取下一个字符，并移动指针
   * 会更新行列信息
   */
  public next(): string {
    const char = this.input.charAt(this.pos++);

    if (char === '\n') {
      this.row++;
      this.col = 0;
    } else {
      this.col++;
    }

    return char;
  }

  /**
   * 判断是否已到达输入末尾
   */
  public eof(): boolean {
    return this.pos >= this.length;
  }

  /**
   * 抛出语法错误，指示当前位置的意外字符
   * @param context 错误上下文描述
   */
  public unexpected(context: string): never {
    const char = this.input.charAt(this.pos);
    const pointer = ' '.repeat(this.col) + '^';

    const message = [
      `Unexpected token "${this.visualize(char)}" while parsing ${context}`,
      `→ at line ${this.row}, column ${this.col}`,
      this.line(),
      pointer,
    ].join('\n');

    throw new SyntaxError(message);
  }

  /**
   * 获取当前行的内容（不包含换行符）
   */
  private line(): string {
    const start = this.input.lastIndexOf('\n', this.pos - 1) + 1;
    const end = this.input.indexOf('\n', this.pos);
    return this.input.slice(start, end === -1 ? this.length : end);
  }

  /**
   * 将特殊字符可视化（用于错误提示）
   */
  private visualize(code: string): string {
    switch (code) {
      case '\n': return '\\n';
      case '\r': return '\\r';
      case '\t': return '\\t';
      case '': return '<EOF>';
      default: return code;
    }
  }
}