import { PriorityQueue } from "@zen-core/queue";

export enum Dirty {
  None = 0,
  Topo = 1 << 0,
  Cycle = 1 << 1,
  Reach = 1 << 2,
}

export enum Direction {
  In = 'in',
  Out = 'out'
}

export type Comparator<T> = (a: T, b: T) => number;

export interface Edge<T> {
  source: T,
  target: T
}

export type NodeFactory<T extends Node> = (id: string) => T;

export interface Node {
  priority?: number;
  readonly id: string;

  _priority?: number;
  _level?: number;
}

export class DAG<T extends Node> {
  private static readonly EMPTY_SET = Object.freeze(new Set()) as Set<string>;

  public readonly nodes: Map<string, T> = new Map();

  private readonly pendingEdges: Set<Edge<string>> = new Set();

  private readonly outEdges: Map<string, Set<string>> = new Map();
  private readonly inEdges: Map<string, Set<string>> = new Map();

  private readonly inDegree: Map<string, number> = new Map();

  private readonly outReachs: Map<string, Set<string>> = new Map();
  private readonly inReachs: Map<string, Set<string>> = new Map();

  private readonly orders: Map<string, T[]> = new Map();
  private readonly subgraphs: Map<string, DAG<T>> = new Map();

  private dirty: Dirty = Dirty.None;

  public get size(): number {
    return this.nodes.size;
  }

  public addNode(node: T): this {
    this._addNode(node);
    this.markDirty(Dirty.Topo | Dirty.Cycle | Dirty.Reach);
    this.flushPendingEdges()
    return this;
  }

  public addNodes(nodes: T[]): this {
    for (const node of nodes) this._addNode(node);
    this.flushPendingEdges()
    this.markDirty(Dirty.Topo | Dirty.Cycle | Dirty.Reach);
    return this;
  }

  private _addNode(node: T) {
    const id = this.resolveId(node)

    if (this.hasNode(id)) return this;

    this.nodes.set(id, node);
    this.outEdges.set(id, new Set());
    this.inEdges.set(id, new Set());
    this.inDegree.set(id, 0);
  }

  public addEdge(source: string | T, target: string | T): this {
    this._addEdge(source, target)
    this.markDirty(Dirty.Topo | Dirty.Cycle | Dirty.Reach);
    return this;
  }

  public addEdges(edges: Edge<string | T>[]): this {
    for (const { source, target } of edges) {
      this._addEdge(source, target);
    }
    this.markDirty(Dirty.Topo | Dirty.Cycle | Dirty.Reach);
    return this;
  }

  private _addEdge(source: string | T, target: string | T) {
    const srcId = this.resolveId(source)
    const tgtId = this.resolveId(target)
    if (!this.hasNode(srcId) || !this.hasNode(tgtId)) {
      this.pendingEdges.add({ source: srcId, target: tgtId });
      return this;
    }

    if (this.outEdges.get(srcId)!.has(tgtId)) return this;

    if (this.isReachable(tgtId, srcId)) {
      throw new Error(`Adding edge ${srcId} -> ${tgtId} would create a cycle`);
    }

    this.outEdges.get(srcId)!.add(tgtId);
    this.inEdges.get(tgtId)!.add(srcId);

    this.inDegree.set(tgtId, (this.inDegree.get(tgtId) ?? 0) + 1);
    return this
  }

  public removeNodes(nodes: (string | T)[]): this {
    for (const node of nodes) this._removeNode(node);
    this.markDirty(Dirty.Topo | Dirty.Cycle | Dirty.Reach);
    return this;
  }

  public removeNode(node: string | T): this {
    this._removeNode(node);
    this.markDirty(Dirty.Topo | Dirty.Cycle | Dirty.Reach);
    return this
  }

  private _removeNode(node: string | T) {
    const id = this.resolveId(node)
    if (!this.hasNode(id)) return this;

    for (const target of this.outEdges.get(id) ?? []) {
      this.inEdges.get(target)?.delete(id);
      this.inDegree.set(target, (this.inDegree.get(target) ?? 1) - 1);
    }

    for (const source of this.inEdges.get(id) ?? []) {
      this.outEdges.get(source)?.delete(id);
      this.inDegree.set(id, (this.inDegree.get(id) ?? 1) - 1);
    }

    this.nodes.delete(id);
    this.inEdges.delete(id);
    this.outEdges.delete(id);
    this.inDegree.delete(id);
  }

  public removeEdges(edges: Edge<string | T>[]): this {
    for (const { source, target } of edges) {
      const srcId = this.resolveId(source)
      const tgtId = this.resolveId(target)
      this._removeEdge(srcId, tgtId)
    };
    this.markDirty(Dirty.Topo | Dirty.Cycle | Dirty.Reach);
    return this
  }

  public removeEdge(source: string | T, target: string | T): this {
    const srcId = this.resolveId(source)
    const tgtId = this.resolveId(target)
    this._removeEdge(srcId, tgtId)
    this.markDirty(Dirty.Topo | Dirty.Cycle | Dirty.Reach);
    return this;
  }

  private _removeEdge(srcId: string, tgtId: string) {
    if (this.outEdges.get(srcId)?.delete(tgtId)) {
      this.inEdges.get(tgtId)?.delete(srcId);
      this.inDegree.set(tgtId, this.inDegree.get(tgtId)! - 1);
    }
  }

  public getNode(id: string): T {
    return this.nodes.get(id)!;
  }

  public hasNode(id: string): boolean {
    return this.nodes.has(id);
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

  public hasEdge(source: string | T, target: string | T): boolean {
    const srcId = this.resolveId(source);
    const tgtId = this.resolveId(target);
    return this.outEdges.get(srcId)?.has(tgtId) ?? false;
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

  public subgraph(node: string | T, direction: Direction = Direction.Out) {
    const id = this.resolveId(node);
    if (!this.hasNode(id)) return new DAG<T>();

    const key = this.createKey(id, direction);
    if (!this.isDirty(Dirty.Reach) && this.subgraphs.has(key)) {
      return this.subgraphs.get(key)!;
    }

    const subdag = this.slice(id, direction);
    this.subgraphs.set(key, subdag);
    return subdag;
  }

  public order(
    node?: string | T
  ): T[] {
    const id = node ? this.resolveId(node) : 'root';
    const key = this.createKey(id, Direction.Out);
    if (!this.isDirty(Dirty.Topo) && this.orders.has(key)) {
      return this.orders.get(key)!;
    }

    const subdag = node ? this.subgraph(node, Direction.Out) : this;
    const potential = subdag.potential();

    const inDegree = new Map(subdag.inDegree);
    const result: T[] = [];

    const queue = new PriorityQueue<string>(
      (a, b) => {
        const [pa, la] = potential.get(a)!;
        const [pb, lb] = potential.get(b)!;

        if (pa !== pb) return pb - pa;
        return la - lb;
      }
    );


    for (const [nid, deg] of inDegree) {
      if (deg === 0) queue.push(nid)
    }

    while (queue.size > 0) {
      const nid = queue.poll();
      const node = subdag.getNode(nid)
      const [priority, level] = potential.get(nid)!
      node._priority = priority
      node._level = level
      result.push(node);

      for (const next of subdag.getOutEdges(nid)) {
        inDegree.set(next, inDegree.get(next)! - 1);
        if (inDegree.get(next) === 0) queue.push(next);
      }
    }

    this.orders.set(key, result);
    this.clearDirty(Dirty.Topo);
    return result;
  }

  protected resolveId(input: string | T): string {
    return typeof input === 'string' ? input : input?.id;
  }

  protected resolveEdges(direction: Direction): Map<string, Set<string>> {
    return direction === Direction.In ? this.inEdges : this.outEdges
  }

  protected resolveReachs(direction: Direction): Map<string, Set<string>> {
    if (this.isDirty(Dirty.Reach)) {
      this.inReachs.clear();
      this.outReachs.clear();
      this.subgraphs.clear();
      this.clearDirty(Dirty.Reach);
    }
    return direction === Direction.Out ? this.outReachs : this.inReachs;
  }

  protected markDirty(flags: Dirty) {
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

  protected isDirty(flag: Dirty): boolean {
    return (this.dirty & flag) !== 0;
  }

  protected clearDirty(flag: Dirty): void {
    this.dirty &= ~flag;
  }

  private flushPendingEdges() {
    for (const edge of Array.from(this.pendingEdges)) {
      const { source, target } = edge
      if (this.hasNode(source) && this.hasNode(target)) {
        this.addEdge(source, target);
        this.pendingEdges.delete(edge);
      }
    }
  }

  private potential(): Map<string, [number, number]> {
    const memo = new Map<string, [number, number]>();

    const dfs = (id: string, level: number): [number, number] => {
      if (memo.has(id)) return memo.get(id)!;

      const node = this.getNode(id);
      let max = node?.priority ?? 1;

      const l = level + 1
      for (const next of this.getOutEdges(id)) {
        if (!this.hasNode(next)) continue;
        const p = this.getNode(next).priority ?? 1;
        max = Math.max(max, dfs(next, l)[0], p);
      }

      memo.set(id, [max, level]);
      return [max, level];
    };

    for (const id of this.nodes.keys()) {
      if (!memo.has(id)) dfs(id, 0);
    }

    return memo;
  }

  private traverse(
    id: string,
    direction: Direction = Direction.Out,
    callback?: (source: string, id: string, dag: DAG<T>) => boolean | void
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

  private slice(id: string, direction: Direction): DAG<T> {
    const subdag = new DAG<T>();
    const edges = this.resolveEdges(direction);

    this.traverse(id, direction, (id) => {
      subdag.addNode(this.nodes.get(id)!);

      for (const neighbor of edges.get(id) ?? []) {
        subdag.addEdge(this.nodes.get(id)!, this.nodes.get(neighbor)!);
      }
    });
    return subdag;
  }

  private createKey(id: string, direction: Direction) {
    return `${direction}:${id}`;
  }
}

