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

// ===============================================================

export class Node<P = unknown> {
  public constructor(
    public readonly id: string,
    public readonly metadata?: P
  ) { }
}

export enum Dirty {
  None = 0,
  Topo = 1 << 0,
  Cycle = 1 << 1,
  Reach = 1 << 2,
}

export enum Direction {
  In,
  Out
}

export type Comparator<T> = (a: T, b: T) => number;

export interface Edge<T> {
  source: T,
  target: T,
  weight?: number;
}

export type Order = 'topological' | 'shortest-path' | 'priority' | 'max-path-weight';

export interface OrderStrategy<P, T extends Node<P>> {
  sort(
    dag: DAG<P, T>,
    subdag: DAG<P, T>,
    startId: string,
    direction: Direction,
    priorities: Map<string, number>
  ): T[];
}


export class TopoStrategy<P, T extends Node<P>> implements OrderStrategy<P, T> {
  public sort(
    _dag: DAG<P, T>,
    subdag: DAG<P, T>,
    startId: string,
    direction: Direction
  ): T[] {
    const reachable = subdag.getReachs(startId, direction);
    reachable.add(startId);

    const inDegree = new Map<string, number>();
    for (const id of reachable) {
      inDegree.set(id, subdag.getInEdges(id).size);
    }

    const queue: string[] = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(id);
    }

    const result: T[] = [];
    while (queue.length > 0) {
      const id = queue.shift()!;
      result.push(subdag.getNode(id));

      for (const neighbor of subdag.getEdges(id, direction)) {
        if (!reachable.has(neighbor)) continue;
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) queue.push(neighbor);
      }
    }

    if (result.length !== subdag.size) {
      throw new Error("Cycle detected in DAG");
    }

    return result;
  }
}

export function getOrderStrategy<P, T extends Node<P>>(type: Order): OrderStrategy<P, T> {
  switch (type) {
    default:
      return new TopoStrategy();
  }
}

export class DAG<P, T extends Node<P>> {
  private static readonly EMPTY_SET = Object.freeze(new Set()) as Set<string>;

  private readonly nodes: Map<string, T> = new Map();

  private readonly outEdges: Map<string, Set<string>> = new Map();
  private readonly inEdges: Map<string, Set<string>> = new Map();

  private readonly inDegree: Map<string, number> = new Map();

  private readonly outReachs: Map<string, Set<string>> = new Map();
  private readonly inReachs: Map<string, Set<string>> = new Map();

  public readonly edgeWeights: Map<string, Map<string, number>> = new Map();

  private readonly priorities: Map<string, number> = new Map();

  private readonly orders: Map<string, T[]> = new Map();
  private readonly subgraphs: Map<string, DAG<P, T>> = new Map();

  private dirty: Dirty = Dirty.None;

  public get size(): number {
    return this.nodes.size;
  }

  public addNode(node: string | T): this {
    const n = this.toNode(node);
    if (this.nodes.has(n.id)) return this;

    this.nodes.set(n.id, n);
    this.outEdges.set(n.id, new Set());
    this.inEdges.set(n.id, new Set());
    this.inDegree.set(n.id, 0);
    this.markDirty(Dirty.Topo | Dirty.Cycle | Dirty.Reach);
    return this;
  }

  public addNodes(...nodes: (string | T)[]): this {
    for (const node of nodes) this.addNode(node);
    return this;
  }


  public addEdges(...edges: Edge<string | T>[]): this {
    for (const { source, target, weight = 1 } of edges) {
      this.addEdge(source, target, weight);
    }
    return this;
  }

  public addEdge(source: string | T, target: string | T, weight: number = 1): this {
    const srcId = this.resolveId(source);
    const tgtId = this.resolveId(target);
    this.addNodes(srcId, tgtId);

    if (this.outEdges.get(srcId)!.has(tgtId)) return this;

    if (this.isReachable(tgtId, srcId)) {
      throw new Error(`Adding edge ${srcId} -> ${tgtId} would create a cycle`);
    }

    this.outEdges.get(srcId)!.add(tgtId);
    this.inEdges.get(tgtId)!.add(srcId);

    this.inDegree.set(tgtId, (this.inDegree.get(tgtId) ?? 0) + 1);

    if (!this.edgeWeights.has(srcId)) this.edgeWeights.set(srcId, new Map());
    this.edgeWeights.get(srcId)!.set(tgtId, weight);

    this.markDirty(Dirty.Topo | Dirty.Cycle | Dirty.Reach);
    return this;
  }

  public removeNodes(...nodes: (string | T)[]): this {
    for (const node of nodes) this.removeNode(node);
    return this;
  }

  public removeNode(node: string | T): this {
    const id = this.resolveId(node);
    if (!this.nodes.has(id)) return this;

    for (const target of this.outEdges.get(id) ?? []) {
      this.inEdges.get(target)?.delete(id);
      this.inDegree.set(target, (this.inDegree.get(target) ?? 1) - 1);
      this.edgeWeights.get(id)?.delete(target);
    }

    for (const source of this.inEdges.get(id) ?? []) {
      this.outEdges.get(source)?.delete(id);
      this.edgeWeights.get(source)?.delete(id);
      this.inDegree.set(id, (this.inDegree.get(id) ?? 1) - 1);
    }

    this.nodes.delete(id);
    this.inEdges.delete(id);
    this.outEdges.delete(id);
    this.inDegree.delete(id);
    this.edgeWeights.delete(id);
    this.priorities.delete(id);

    this.markDirty(Dirty.Topo | Dirty.Cycle | Dirty.Reach);
    return this
  }

  public removeEdges(...edges: Edge<string | T>[]): this {
    for (const { source, target } of edges) this.removeEdge(source, target);
    return this
  }

  public removeEdge(source: string | T, target: string | T): this {
    const srcId = this.resolveId(source);
    const tgtId = this.resolveId(target);

    if (this.outEdges.get(srcId)?.delete(tgtId)) {
      this.inEdges.get(tgtId)?.delete(srcId);
      this.inDegree.set(tgtId, this.inDegree.get(tgtId)! - 1);
      this.edgeWeights.get(srcId)?.delete(tgtId);
      this.markDirty(Dirty.Topo | Dirty.Cycle | Dirty.Reach);
    }
    return this;
  }

  public getNode(node: string | T): T {
    return this.nodes.get(this.resolveId(node))!;
  }

  public hasNode(node: string | T): boolean {
    return this.nodes.has(this.resolveId(node));
  }

  public getOutEdges(node: string | T): ReadonlySet<string> {
    return this.outEdges.get(this.resolveId(node)) ?? DAG.EMPTY_SET;
  }

  public getInEdges(node: string | T): ReadonlySet<string> {
    return this.inEdges.get(this.resolveId(node)) ?? DAG.EMPTY_SET;
  }

  public getEdges(node: string | T, direction: Direction = Direction.Out) {
    return direction === Direction.In ? this.getInEdges(node) : this.getOutEdges(node)
  }

  public setPriority(node: string | T, priority: number) {
    this.priorities.set(this.resolveId(node), priority);
    this.markDirty(Dirty.Topo);
  }

  public isReachable(source: string | T, target: string | T): boolean {
    const srcId = this.resolveId(source);
    const tgtId = this.resolveId(target);
    if (srcId === tgtId) return true;
    return this.getReachs(srcId, Direction.Out).has(tgtId);
  }

  public getReachs(id: string, direction: Direction = Direction.Out): Set<string> {
    const reachs = this.resolveReachs(direction);
    if (!reachs.has(id)) {
      const visited = this.traverse(id, direction);
      reachs.set(id, visited);
    }
    return reachs.get(id)!;
  }

  public order(
    node: string | T,
    order: Order = 'topological',
    direction: Direction = Direction.Out,
  ) {
    const id = this.resolveId(node);
    const key = this.createKey(id, direction);
    if (!this.isDirty(Dirty.Topo) && this.orders.has(key)) {
      return this.orders.get(key)!;
    }

    const subdag = this.subgraph(node, direction);
    console.log(subdag)
    // const strategy = getOrderStrategy<P, T>(order);
    // const result = strategy.sort(this, subdag, id, direction, this.priorities);

    // this.orders.set(key, result);
    // return result;
  }

  public subgraph(node: string | T, direction: Direction = Direction.Out) {
    const id = this.resolveId(node);
    if (!this.hasNode(id)) return new DAG<P, T>();

    const key = this.createKey(id, direction);
    if (!this.isDirty(Dirty.Reach) && this.subgraphs.has(key)) {
      return this.subgraphs.get(key)!;
    }

    const subdag = this.slice(id, direction);
    this.subgraphs.set(key, subdag);
    return subdag;
  }

  private traverse(
    id: string,
    direction: Direction = Direction.Out,
    callback?: (source: string, id: string, dag: DAG<P, T>) => boolean | void
  ): Set<string> {
    const visited = new Set<string>();
    const stack = [id];
    const edges = this.resolveEdges(direction);

    while (stack.length > 0) {
      const top = stack.pop()!;

      if (!this.hasNode(top) || visited.has(top)) continue;

      visited.add(top);
      if (callback && callback(top, id, this) === false) break;

      for (const next of edges.get(top) ?? []) {
        if (!visited.has(next)) stack.push(next);
      }
    }

    return visited;
  }

  private slice(id: string, direction: Direction): DAG<P, T> {
    const subdag = new DAG<P, T>();
    const edges = this.resolveEdges(direction);

    this.traverse(id, direction, (id) => {
      subdag.addNode(this.nodes.get(id)!);

      for (const neighbor of edges.get(id) ?? []) {
        const weight = this.edgeWeights.get(id)?.get(neighbor) ?? 1;
        subdag.addEdge(id, neighbor, weight);
      }
    });

    return subdag;
  }

  private toNode(input: string | T): T {
    return typeof input === 'string' ? new Node(input) as T : input
  }

  private createKey(id: string, direction: Direction) {
    return `${direction}:${id}`;
  }

  private resolveId(input: string | T): string {
    return typeof input === 'string' ? input : input.id;
  }

  private resolveEdges(direction: Direction): Map<string, Set<string>> {
    return direction === Direction.In ? this.inEdges : this.outEdges
  }

  private resolveReachs(direction: Direction): Map<string, Set<string>> {
    if (this.isDirty(Dirty.Reach)) {
      this.inReachs.clear();
      this.outReachs.clear();
      this.subgraphs.clear();
      this.clearDirty(Dirty.Reach);
    }
    return direction === Direction.Out ? this.outReachs : this.inReachs;
  }

  private markDirty(flags: Dirty) {
    this.dirty |= flags;

    if (flags & Dirty.Reach) {
      this.inReachs.clear();
      this.outReachs.clear();
      this.subgraphs.clear();
    }

    if (flags & Dirty.Topo) {
      this.orders.clear();
    }
  }

  private isDirty(flag: Dirty): boolean {
    return (this.dirty & flag) !== 0;
  }

  private clearDirty(flag: Dirty): void {
    this.dirty &= ~flag;
  }
}

export enum Status {
  Waiting,
  Running,
  Success,
  Failed
}

export class StatefulNode<P = unknown> extends Node<P> {
  public status: Status = Status.Waiting;

  public constructor(
    public readonly id: string,
    public priority: number = 0,
    public metadata?: P
  ) {
    super(id, metadata)
  }

  public onLoad() { }

  public onSuccess() { }

  public onFailed() { }

  public onFinished() { }

  public onReset(): void {
    this.status = Status.Waiting;
  }
}

export class StatefulDAG<P, T extends StatefulNode<P>> extends DAG<P, T> {
  private readonly nodeVersions: Map<string, number> = new Map();

  private paused: boolean = false;
  private resumeResolvers: (() => void)[] = [];

  public pause(): void {
    this.paused = true;
  }

  public resume(run: boolean = false) {
    if (!this.paused) return;
    this.paused = false;
    if (!run) {
      for (const resolve of this.resumeResolvers) resolve();
    }
    this.resumeResolvers.length = 0;
  }

  public async execute(node: T, version: number, signal?: AbortSignal) {
    if (this.shouldAbort(node.id, version, signal)) return;

    try {
      await Promise.resolve(node.onLoad());
      if (this.shouldAbort(node.id, version, signal)) return;

      node.status = Status.Success;
      node.onSuccess?.();
    } catch (error) {
      if (this.shouldAbort(node.id, version, signal)) return;

      node.status = Status.Failed;
      node.onFailed?.();
    } finally {
      if (this.shouldAbort(node.id, version, signal)) return;

      node.onFinished?.();
    }
  }

  private _run(id: string, version?: number, signal?: AbortSignal) {

  }

  private async waitResume(): Promise<void> {
    if (!this.paused) return Promise.resolve();
    return new Promise<void>((resolve) => {
      this.resumeResolvers.push(resolve);
    });
  }

  private shouldAbort(id: string, version: number, signal?: AbortSignal): boolean {
    const currentVersion = this.nodeVersions.get(id) ?? 0;
    return version !== currentVersion || !!signal?.aborted;
  }
}



const dag = new DAG()

dag.addNodes('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J').addEdges(
  { source: 'A', target: 'B', weight: 50 },
  { source: 'A', target: 'C' },
  { source: 'C', target: 'D' },
  { source: 'A', target: 'E' },
  { source: 'B', target: 'D' },
  { source: 'D', target: 'G' },
  { source: 'G', target: 'J' },
  { source: 'E', target: 'F' },
  { source: 'F', target: 'H', weight: 100 },
  { source: 'H', target: 'M' },
)

console.log(dag.order('A'))