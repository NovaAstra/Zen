import { BinaryHeap } from "@zen-core/heap"

export class PriorityQueue<T> {
  private readonly heap: BinaryHeap<T>;

  public constructor(comparator: (a: T, b: T) => number) {
    this.heap = new BinaryHeap<T>(comparator);
  }

  public get size(): number {
    return this.heap.size;
  }

  public push(...nodes: T[]): number {
    nodes.forEach(node => this._push(node));
    return this.size;
  }

  public poll(): T {
    return this.heap.poll()!;
  }

  public peek(): T {
    return this.heap.peek()!;
  }

  public clear(): void {
    this.heap.clear();
  }

  public toArray(): readonly T[] {
    return this.heap.toArray();
  }

  private _push(node: T): number {
    return this.heap.push(node);
  }
}

const queue = new PriorityQueue<number>(
  (a, b) => a - b
);
