import { BinaryHeap } from "@zen-core/heap"

export class PriorityQueue<T> {
  private readonly heap: BinaryHeap<T>;

  public constructor(
    comparator: (a: T, b: T) => number,
    duplicate: boolean = true
  ) {
    this.heap = new BinaryHeap<T>(comparator, duplicate);
  }

  public get size(): number {
    return this.heap.size;
  }

  public push(...nodes: T[]): PriorityQueue<T> {
    for (const node of nodes) {
      this._push(node);
    }
    return this;
  }

  public remove(node: T): boolean {
    return this.heap.remove(node);
  }

  public poll(): T {
    return this.heap.poll()!;
  }

  public has(node: T): boolean {
    return this.heap.has(node) ?? false;
  }

  public peek(): T {
    return this.heap.peek()!;
  }
  
  public rebuild(): void {
    return this.heap.rebuild();
  }

  public clear(): void {
    this.heap.clear();
  }

  public toArray(): readonly T[] {
    return this.heap.toArray();
  }

  public [Symbol.iterator](): Iterator<T> {
    return this.heap.toArray()[Symbol.iterator]();
  }

  private _push(node: T): number {
    return this.heap.push(node);
  }
}
