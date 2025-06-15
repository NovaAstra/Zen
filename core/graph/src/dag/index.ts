import { PriorityQueue } from "@zen-core/queue";

export class Node<P = unknown> {
  public _priority: number = 0

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
  In = 'in',
  Out = 'out'
}

export type Comparator<T> = (a: T, b: T) => number;

export interface Edge<T> {
  source: T,
  target: T,
  weight?: number;
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
    this.addNodes(source, target);

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
    if (!this.hasNode(id)) return new DAG<P, T>();

    const key = this.createKey(id, direction);
    if (!this.isDirty(Dirty.Reach) && this.subgraphs.has(key)) {
      return this.subgraphs.get(key)!;
    }

    const subdag = this.slice(id, direction);
    this.subgraphs.set(key, subdag);
    return subdag;
  }

  public order(
    node: string | T
  ): T[] {
    const id = this.resolveId(node);
    const key = this.createKey(id, Direction.Out);
    if (!this.isDirty(Dirty.Topo) && this.orders.has(key)) {
      return this.orders.get(key)!;
    }

    const subdag = this.subgraph(node, Direction.Out);
    const potential = subdag.potential();

    const inDegree = new Map(subdag.inDegree);
    const result: T[] = [];

    const queue = new PriorityQueue<string>(
      (a, b) => potential.get(b)! - potential.get(a)!
    );

    for (const [nid, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(nid);
    }

    while (queue.size > 0) {
      const nid = queue.poll();
      const node = subdag.getNode(nid)
      node._priority = potential.get(nid)!
      result.push(node);

      for (const next of subdag.getOutEdges(nid)) {
        inDegree.set(next, inDegree.get(next)! - 1);
        if (inDegree.get(next) === 0) queue.push(next);
      }
    }


    this.orders.set(key, result);
    return result;
  }

  protected resolveId(input: string | T): string {
    return typeof input === 'string' ? input : input.id;
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

  private potential(): Map<string, number> {
    const memo = new Map<string, number>();

    const dfs = (id: string, weight: number = 0): number => {
      if (memo.has(id)) return memo.get(id)!;

      let max = weight;

      for (const next of this.getOutEdges(id)) {
        const weight = this.edgeWeights.get(id)?.get(next) ?? 1;
        max = Math.max(max, weight, dfs(next, weight)  + 1);
      }

      memo.set(id, max);
      return max;
    };

    for (const id of this.nodes.keys()) {
      dfs(id);
    }

    return memo;
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
        subdag.addEdge(this.nodes.get(id)!, this.nodes.get(neighbor)!, weight);
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