export type Comparator<T> = (a: T, b: T) => number;

export class BinaryHeap<T> {
  private readonly heap: T[] = [];
  private readonly indexMap: Map<T, number> = new Map();

  public constructor(
    private readonly comparator: Comparator<T>,
    private readonly duplicate: boolean = true
  ) { }

  public get size(): number {
    return this.heap.length
  }

  public has(node: T): boolean {
    return this.indexMap.has(node);
  }

  public peek(): T | undefined {
    return this.heap[0]
  }

  public poll(): T | undefined {
    if (this.size === 0) return undefined;

    const top = this.heap[0];
    this.indexMap.delete(top);

    const last = this.heap.pop()!;
    if (this.size > 0) {
      this.heap[0] = last;
      this.indexMap.set(last, 0);
      this.heapifyDown();
    }

    return top;
  }

  public push(node: T,): number {
    if (!this.duplicate) {
      const index = this.indexMap.get(node);
      if (index !== undefined) {
        this.heap[index] = node;
        this.heapifyUp(index);
        this.heapifyDown(index);
        return this.size;
      }
    }

    this.heap.push(node);
    this.indexMap.set(node, this.size - 1);
    this.heapifyUp(this.size - 1);
    return this.size;
  }

  public remove(node: T): boolean {
    const index = this.indexMap.get(node);
    if (index === undefined) return false;

    this.indexMap.delete(node);

    const lastIndex = this.size - 1;
    if (index === lastIndex) {
      this.heap.pop();
      return true;
    }

    const lastNode = this.heap.pop()!;
    this.heap[index] = lastNode;
    this.indexMap.set(lastNode, index);

    this.heapifyDown(index);
    this.heapifyUp(index);

    return true;
  }

  public rebuild(): void {
    for (let i = Math.floor(this.size / 2); i >= 0; i--) {
      this.heapifyDown(i);
    }
  }

  public clear(): void {
    this.heap.length = 0;
    this.indexMap.clear()
  }

  public toArray(): readonly T[] {
    return [...this.heap];
  }

  private heapifyUp(index: number = this.size - 1): void {
    while (
      this.hasParent(index) &&
      this.comparator(this.heap[index], this.getParent(index)) < 0
    ) {
      const parentIndex = this.getParentIndex(index);
      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  private heapifyDown(index: number = 0): void {
    while (this.hasLeftChild(index)) {
      let smallestChildIndex = this.getLeftChildIndex(index);

      if (
        this.hasRightChild(index) &&
        this.comparator(
          this.heap[this.getRightChildIndex(index)],
          this.heap[smallestChildIndex]
        ) < 0
      ) {
        smallestChildIndex = this.getRightChildIndex(index);
      }

      if (this.comparator(this.heap[index], this.heap[smallestChildIndex]) <= 0) break;

      this.swap(index, smallestChildIndex);
      index = smallestChildIndex;
    }
  }

  private getParent(index: number): T {
    return this.heap[this.getParentIndex(index)]
  }

  private getLeftChild(index: number) {
    return this.heap[this.getLeftChildIndex(index)];
  }

  private getRightChild(index: number) {
    return this.heap[this.getRightChildIndex(index)];
  }

  private getParentIndex(index: number): number {
    return Math.floor((index - 1) / 2);
  }


  private getLeftChildIndex(index: number): number {
    return 2 * index + 1;
  }

  private getRightChildIndex(index: number): number {
    return 2 * index + 2;
  }

  private hasParent(index: number): boolean {
    return this.getParentIndex(index) >= 0;
  }

  private hasLeftChild(index: number): boolean {
    return this.getLeftChildIndex(index) < this.size;
  }

  private hasRightChild(index: number): boolean {
    return this.getRightChildIndex(index) < this.size;
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];

    this.indexMap.set(this.heap[i], i);
    this.indexMap.set(this.heap[j], j);
  }
}