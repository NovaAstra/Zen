export class Node<T> {
  public constructor(
    public value: T,
    public prev?: Node<T>,
    public next?: Node<T>
  ) { }
}

export class Deque<T> {
  private head?: Node<T>;

  private tail?: Node<T>;

  private length: number = 0;

  public push(...values: T[]): number {
    const [head, tail] = createNodes(values);

    if (this.tail) {
      this.tail.next = head;
      head.prev = this.tail;
    } else {
      this.head = head;
    }

    this.tail = tail;
    this.length += values.length;
    return this.length;
  }

  public pop(): T | undefined {
    if (!this.tail) return undefined;

    const tail = this.tail;
    this.tail = tail.prev;

    if (this.tail) {
      this.tail.next = undefined;
    } else {
      this.head = undefined;
    }

    this.length--;
    return tail.value;
  }

  public shift(): T | undefined {
    if (!this.head) return undefined;

    const head = this.head;
    this.head = head.next;

    if (this.head) {
      this.head.prev = undefined;
    } else {
      this.tail = undefined;
    }

    this.length--;
    return head.value;
  }

  public size(): number {
    return this.length;
  }
}

function createNodes<T>(values: T[]): [head: Node<T>, tail: Node<T>] {
  const { head, tail } = values.reduce<{ head: Node<T>; tail: Node<T> }>(
    ({ head, tail }, value, index) => {
      const node = new Node<T>(value);
      if (index === 0) return { head: node, tail: node };

      node.prev = tail;
      tail.next = node;
      return { head, tail: node };
    },
    {} as { head: Node<T>, tail: Node<T> }
  );

  return [head, tail];
}
