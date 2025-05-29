export type Callback<T, R = boolean> = (value: T, index: number, deque: Deque<T>, node: Node<T>) => R;

export class Node<T> {
  public constructor(
    public value: T,
    public prev?: Node<T>,
    public next?: Node<T>
  ) { }
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

export class Deque<T> {
  private head?: Node<T>;

  private tail?: Node<T>;

  private size: number = 0;

  constructor(iterable: Iterable<T> = []) {
    this.push(...iterable);
  }

  public push(...values: T[]): number {
    const [head, tail] = createNodes(values);

    if (this.tail) {
      this.tail.next = head;
      head.prev = this.tail;
    } else {
      this.head = head;
    }

    this.tail = tail;
    this.size += values.length;
    return this.size;
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

    this.size--;
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

    this.size--;
    return head.value;
  }

  public toReversed() {

  }

  public reverse() {
    let node = this.head;

    while (node) {
      const { prev, next } = node;
      [node.prev, node.next] = [next, prev];
      node = next;
    }
    [this.head, this.tail] = [this.tail, this.head];

    return this;
  }

  public findIndex(callback: Callback<T>): number {
    let index = 0;
    let node = this.head;

    while (node) {
      if (callback(node.value, index, this, node)) return index;
      node = node.next;
      index++;
    }
    return -1;
  }

  public find(callback: Callback<T>): T | undefined {
    let index = 0;
    let node = this.head;

    while (node) {
      if (callback(node.value, index, this, node)) return node.value;
      node = node.next;
      index++;
    }
    return undefined;
  }

  public every(callback: Callback<T>): boolean {
    let index = 0;
    let node = this.head;

    while (node) {
      if (!callback(node.value, index, this, node)) return false;
      node = node.next;
      index++;
    }
    return false;
  }

  public some(callback: Callback<T>): boolean {
    let index = 0;
    let node = this.head;

    while (node) {
      if (callback(node.value, index, this, node)) return true;
      node = node.next;
      index++;
    }
    return false;
  }

  public filter(callback: Callback<T>): Deque<T> {
    const deque = new Deque<T>();

    let index = 0;
    let node = this.head;

    while (node) {
      if (callback(node.value, index, this, node))
        deque.push(node.value);
      node = node.next;
      index++;
    }

    return deque;
  }

  public forEach(callback: Callback<T, void>): void {
    let index = 0;
    let node = this.head;

    while (node) {
      callback(node.value, index, this, node);
      node = node.next;
      index++;
    }
  }

  public map<N>(callback: Callback<T, N>): Deque<N> {
    const deque = new Deque<N>();

    let index = 0;
    let node = this.head;

    while (node) {
      deque.push(callback(node.value, index, this, node));
      node = node.next;
      index++;
    }

    return deque;
  }

  public clear() {
    this.head = this.tail = undefined;
    this.size = 0;
  }

  public [Symbol.iterator](): Iterator<T> {
    return this.values();
  }

  private *values(): Iterator<T> {
    let node = this.head;

    while (node) {
      yield node.value;

      node = node.next;
    }
  }
}