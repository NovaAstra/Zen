import { PriorityQueue } from "@zen-core/queue";

export type Direction = 'dependencies' | 'dependents'

export class Node {
  public readonly dependencies: Set<string> = new Set();
  public readonly dependents: Set<string> = new Set();

  public constructor(public readonly id: string) { }
}

export class DAG<T extends Node> {
  public readonly nodes: Map<string, T> = new Map();
  public readonly paths: Map<string, Set<string>> = new Map();

  public get size(): number {
    return this.nodes.size;
  }

  public add(node: T, override: boolean = false): void {
    if (!this.has(node.id) || override) {
      this.nodes.set(node.id, node);
      this.evictPaths(node.id);
    };
  }


  public get(id: string): T | undefined {
    return this.nodes.get(id);
  }

  public has(id: string): boolean {
    return this.nodes.has(id);
  }

  public delete(id: string): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;

    for (const depId of node.dependencies) {
      this.nodes.get(depId)?.dependents.delete(id);
    }

    for (const dependentId of node.dependents) {
      this.nodes.get(dependentId)?.dependencies.delete(id);
    }

    this.evictPaths(id);
    return this.nodes.delete(id);
  }

  public clear(): void {
    this.nodes.clear();
    this.paths.clear();
  }

  public isRoot(id: string): boolean {
    const node = this.get(id);
    return !!node && node.dependencies.size === 0;
  }

  public isLeaf(id: string): boolean {
    const node = this.get(id);
    return !!node && node.dependents.size === 0;
  }

  public link(sourceId: string, targetId: string): boolean {
    const source = this.get(sourceId);
    const target = this.get(targetId);
    if (!source || !target) return false;

    if (this.cycle(sourceId, targetId)) return false

    source.dependencies.add(targetId);
    target.dependents.add(sourceId);

    this.evictPaths(sourceId);
    this.evictPaths(targetId);
    return true;
  }


  public unlink(sourceId: string, targetId: string): boolean {
    const source = this.nodes.get(sourceId);
    const target = this.nodes.get(targetId);

    if (!source || !target) return false;
    if (!source.dependencies.has(targetId)) return false;

    source.dependencies.delete(targetId);
    target.dependents.delete(sourceId);

    this.evictPaths(sourceId);
    this.evictPaths(targetId);
    return true;
  }

  public order(sourceId?: string, direction: Direction = 'dependencies'): string[] {
    const scope = sourceId ? this.getPaths(sourceId, direction) : new Set(this.nodes.keys());

    const degree = new Map<string, number>();
    for (const id of scope) degree.set(id, 0);

    for (const id of scope) {
      const node = this.get(id)!;
      const incomingNodes = this.getNeighbors(node, direction);
      for (const incoming of incomingNodes) {
        if (scope.has(incoming)) {
          degree.set(id, (degree.get(id) ?? 0) + 1);
        }
      }
    }

    const queue: string[] = [];
    for (const [id, deg] of degree) {
      if (deg === 0) queue.push(id);
    }

    const result: string[] = [];

    while (queue.length) {
      const id = queue.shift()!;
      result.push(id);

      const node = this.get(id)!;
      const outgoingNodes = this.getNeighbors(node, this.reverseDirection(direction));
      for (const adj of outgoingNodes) {
        if (!scope.has(adj)) continue;
        const deg = (degree.get(adj) ?? 0) - 1;
        degree.set(adj, deg);
        if (deg === 0) queue.push(adj);
      }
    }

    if (result.length !== scope.size) {
      throw new Error('Graph contains at least one cycle');
    }

    return result;
  }

  public subgraph(sourceId: string, direction: Direction = 'dependencies'): DAG<T> {
    const visited = new Set<string>();
    this.traverse(sourceId, id => {
      visited.add(id);
    }, direction);

    const sub = new DAG<T>();
    for (const id of visited) {
      const node = this.get(id);
      if (node) {
        const copy = new Node(id) as T;
        sub.add(copy);
      }
    }

    for (const id of visited) {
      const node = this.get(id)!;
      const links = this.getNeighbors(node, direction);
      for (const targetId of links) {
        if (visited.has(targetId)) {
          direction === 'dependencies'
            ? sub.link(id, targetId)
            : sub.link(targetId, id);
        }
      }
    }

    return sub;
  }

  public hasPath(sourceId: string, targetId: string): boolean {
    return this.getPaths(sourceId).has(targetId);
  }

  public getPaths(sourceId: string, direction: Direction = 'dependencies'): Set<string> {
    if (!this.has(sourceId)) return new Set();

    const cacheKey = this.cacheKey(direction, sourceId);
    if (this.paths.has(cacheKey)) return this.paths.get(cacheKey)!;

    const visited = new Set<string>()
    this.traverse(sourceId, id => { visited.add(id) }, direction);

    visited.delete(sourceId);

    this.paths.set(cacheKey, visited);
    return visited
  }

  public getAllPaths(sourceId: string, direction: Direction = 'dependents'): string[][] {
    const result: string[][] = [];
    const path: string[] = [];

    const dfs = (currentId: string) => {
      const node = this.get(currentId);
      if (!node) return;

      path.push(currentId);

      const neighbors = this.getNeighbors(node, direction);

      if (neighbors.size === 0) {
        result.push([...path]);
      } else {
        for (const neighbor of neighbors) {
          dfs(neighbor);
        }
      }

      path.pop();
    };

    dfs(sourceId);
    return result;
  }

  public forEach(sourceId: string, callback: (id: string) => boolean | void): void {
    this.traverse(sourceId, callback)
  }

  protected cycle(sourceId: string, targetId: string): boolean {
    return this.hasPath(targetId, sourceId);
  }

  protected traverse(sourceId: string, callback: (id: string) => boolean | void, direction: Direction = 'dependencies'): void {
    const visited = new Set<string>()
    const stack = [sourceId]

    while (stack.length) {
      const id = stack.pop()!
      if (visited.has(id)) continue
      visited.add(id)

      const stop = callback(id)
      if (stop === false) break

      const node = this.get(id)
      if (!node) continue

      const neighbors = this.getNeighbors(node, direction);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }

  protected evictPaths(id: string): void {
    const toDelete: string[] = [];
    for (const [key, reachable] of this.paths.entries()) {
      const [direction, sourceId] = key.split(':');
      if (sourceId === id || reachable.has(id)) {
        toDelete.push(key);
      }
    }
    for (const key of toDelete) {
      this.paths.delete(key);
    }
  }

  private getNeighbors(node: T, direction: Direction): Set<string> {
    return direction === 'dependencies' ? node.dependencies : node.dependents;
  }

  private reverseDirection(direction: Direction): Direction {
    return direction === 'dependencies' ? 'dependents' : 'dependencies';
  }

  private cacheKey(direction: Direction, sourceId: string): string {
    return `${direction}:${sourceId}`;
  }
}

export enum Status {
  Waiting,
  Running,
  Success,
  Failed
}

export class StatefulNode<T> extends Node {
  public status: Status = Status.Waiting;

  public constructor(
    public readonly id: string,
    public name?: string,
    public data?: T
  ) {
    super(id)
  }

  public onLoad(data: Record<string, T>, node: Node) {
  }

  public onSuccess(data: Record<string, T>, node: Node) { }

  public onFailed(error: Error, data: Record<string, T>, node: Node) { }

  public onFinished(data: Record<string, T>, node: Node) { }

  public onReset(node: Node): void { }
}

export class StatefulDAG<D, T extends StatefulNode<D>> extends DAG<T> {
  protected readonly nodeVersions: Map<string, number> = new Map();

  protected paused: boolean = false;

  protected resumeResolvers: (() => void)[] = [];

  public async run(id: string, version?: number, signal?: AbortSignal, rootId?: string): Promise<void> {
    if (this.paused) {
      this.resume(true)
    }

    await this._run(id, version, signal, rootId ?? id)
  }

  public async restart(id: string, signal?: AbortSignal) {
    const chain = this.order(id, 'dependents');
    chain.push(id);

    for (const nodeId of chain) {
      const node = this.get(nodeId);
      if (node) {
        this.nodeVersions.set(nodeId, (this.nodeVersions.get(nodeId) ?? 0) + 1);
        node.status = Status.Waiting;
        node.onReset?.(node);
      }
    }

    const tasks: Promise<void>[] = []
    for (const nodeId of chain) {
      tasks.push(this._run(nodeId, this.nodeVersions.get(nodeId), signal))
    }
    await Promise.all(tasks);
  }

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

  public isReady(id: string): boolean {
    const node = this.get(id);
    if (!node) return false;
    if (node.status !== Status.Waiting) return false;

    for (const depId of node.dependencies) {
      const dep = this.get(depId);
      if (!dep || dep.status !== Status.Success) return false;
    }
    return true;
  }

  public isFinished(id: string): boolean {
    const node = this.get(id);
    if (!node) return false;
    return node.status === Status.Success || node.status === Status.Failed;
  }

  protected async waitResume(): Promise<void> {
    if (!this.paused) return Promise.resolve();
    return new Promise<void>((resolve) => {
      this.resumeResolvers.push(resolve);
    });
  }

  protected tryActive(id: string): false | T {
    const node = this.get(id);

    if (!node || node.status !== Status.Waiting) return false;

    for (const depId of node.dependencies) {
      const dep = this.get(depId);
      if (!dep || dep.status !== Status.Success) return false;
    }

    node.status = Status.Running;
    return node;
  }

  protected getDependencyData(id: string): Record<string, D> {
    const data: Record<string, D> = {};
    const deps = this.getPaths(id, 'dependencies');

    for (const depId of deps) {
      const node = this.get(depId);
      if (node?.status === Status.Success && node.data !== undefined) {
        data[depId] = node.data;
      }
    }

    return data;
  }

  protected shouldAbort(id: string, version: number, signal?: AbortSignal): boolean {
    const currentVersion = this.nodeVersions.get(id) ?? 0;
    return version !== currentVersion || !!signal?.aborted;
  }

  protected async execute(node: T, version: number, signal?: AbortSignal) {
    if (this.shouldAbort(node.id, version, signal)) return;

    const depsData = this.getDependencyData(node.id);

    try {
      await Promise.resolve(node.onLoad(depsData, node));
      if (this.shouldAbort(node.id, version, signal)) return;

      node.status = Status.Success;
      node.onSuccess?.(depsData, node);
    } catch (error) {
      if (this.shouldAbort(node.id, version, signal)) return;

      node.status = Status.Failed;
      node.onFailed?.(error as Error, depsData, node);
    } finally {
      if (this.shouldAbort(node.id, version, signal)) return;

      node.onFinished?.(depsData, node);
    }
  }

  private async _run(id: string, version?: number, signal?: AbortSignal, rootId: string = id): Promise<void> {
    const nodeVersion = this.nodeVersions.get(id) ?? 0;
    if (version === undefined) version = nodeVersion;

    if (this.shouldAbort(id, version, signal)) return;
    await this.waitResume();
    if (this.shouldAbort(id, version, signal)) return;

    const node = this.get(id);
    if (!node) return;

    for (const depId of node.dependencies) {
      const depNode = this.get(depId);
      if (!depNode) return;

      if (depNode.status !== Status.Success) {
        await this._run(depId, this.nodeVersions.get(depId), signal, rootId);
        if (this.shouldAbort(id, version, signal)) return;

        const depNodeAfterRun = this.get(depId);
        if (!depNodeAfterRun || depNodeAfterRun.status !== Status.Success) return;
      }
    }

    const activeNode = this.tryActive(id);
    if (activeNode === false) return;

    await this.execute(activeNode, version, signal);


    if (rootId === id) {
      const tasks: Promise<void>[] = []
      for (const dependentId of activeNode.dependents) {
        tasks.push(this._run(dependentId, this.nodeVersions.get(dependentId), signal))
      }
      await Promise.all(tasks);
    }
  }
}

export interface PriorityDAGOptions {
  maxConcurrency: number;
  useIdleCallback: boolean;
}

const nextIdle = (callback: () => void) => {
  return typeof requestIdleCallback === 'function'
    ? requestIdleCallback(callback, { timeout: 1000 })
    : setTimeout(callback, 16) as unknown as number;
};

const cancelIdle = (id: number): void => {
  return typeof requestIdleCallback === 'function'
    ? cancelIdleCallback(id)
    : clearTimeout(id);
};

export class PriorityNode<T> extends StatefulNode<T> {
  public priority: number = 0;

  public _priority: number = this.priority;
  public _version?: number;
  public _signal?: AbortSignal;
}

const DEFAULT_OPTIONS: PriorityDAGOptions = {
  maxConcurrency: 2,
  useIdleCallback: false
};

export class PriorityDAG<D, T extends PriorityNode<D>> extends StatefulDAG<D, T> {
  private lastExecutedNodeId: string | null = null;
  private levels: Map<string, number> = new Map();
  private reachable: Set<string> = new Set();
  private inDegree: Map<string, number> = new Map();

  private pq: PriorityQueue<T>;

  constructor() {
    super();
    this.pq = new PriorityQueue<T>((a, b) => this.compareNodes(a, b));
  }

  private compareNodes(a: T, b: T): number {
    const diff = (b._priority ?? 0) - (a._priority ?? 0);
    if (diff !== 0) return diff;

    if (this.lastExecutedNodeId) {
      const lastNode = this.get(this.lastExecutedNodeId);
      const lastDependents = lastNode?.dependents;

      const aIsDependent = lastDependents?.has(a.id) ?? false;
      const bIsDependent = lastDependents?.has(b.id) ?? false;

      if (aIsDependent && !bIsDependent) return -1;
      if (bIsDependent && !aIsDependent) return 1;
    }

    return (this.levels.get(a.id) ?? Infinity) - (this.levels.get(b.id) ?? Infinity);
  }

  private computeMaxPathPriority(nodeId: string, memo = new Map<string, number>()): number {
    if (memo.has(nodeId)) return memo.get(nodeId)!;

    const node = this.get(nodeId);
    if (!node) return 0;

    let maxPriority = node.priority;
    for (const depId of node.dependents) {
      maxPriority = Math.max(maxPriority, this.computeMaxPathPriority(depId, memo));
    }

    memo.set(nodeId, maxPriority);
    node._priority = maxPriority;
    return maxPriority;
  }

  private getDownstreamReachableNodes(startNodeId: string): Set<string> {
    const visited = new Set<string>();
    const queue = [startNodeId];
    visited.add(startNodeId);

    while (queue.length) {
      const current = queue.shift()!;
      const node = this.get(current);
      if (!node) continue;

      for (const next of node.dependents) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }
    return visited;
  }

  private buildInDegreeMap(subset: Set<string>): Map<string, number> {
    const inDegree = new Map<string, number>();
    for (const id of subset) {
      const node = this.get(id);
      if (!node) continue;

      let count = 0;
      for (const depId of node.dependencies) {
        if (subset.has(depId)) count++;
      }
      inDegree.set(id, count);
    }
    return inDegree;
  }

  private computeLevels(startNodeId: string, reachable: Set<string>): Map<string, number> {
    const levels = new Map<string, number>();
    levels.set(startNodeId, 0);
    const queue = [startNodeId];

    while (queue.length) {
      const current = queue.shift()!;
      const currentLevel = levels.get(current)!;
      const node = this.get(current);
      if (!node) continue;

      for (const depId of node.dependents) {
        if (!reachable.has(depId)) continue;
        const existingLevel = levels.get(depId);
        if (existingLevel === undefined || existingLevel > currentLevel + 1) {
          levels.set(depId, currentLevel + 1);
          queue.push(depId);
        }
      }
    }
    return levels;
  }

  // 动态提升某个节点及其路径优先级
  public boostPriority(nodeId: string, delta: number): void {
    const node = this.get(nodeId);
    if (!node || !this.reachable.has(nodeId)) return;

    node.priority += delta;

    const memo = new Map<string, number>();
    // 只对当前reachable子图重新计算 max path priority
    for (const id of this.reachable) {
      this.computeMaxPathPriority(id, memo);
    }

    // 重建优先队列中的元素顺序（不移除并重插入会导致堆结构失效）
    const nodes: T[] = [];
    while (this.pq.size > 0) {
      nodes.push(this.pq.poll()!);
    }
    for (const n of nodes) {
      this.pq.push(n);
    }
  }


  public async run(startNodeId: string, version?: number, signal?: AbortSignal): Promise<void> {
    if (!this.has(startNodeId)) throw new Error(`Node ${startNodeId} not found`);

    this.reachable = this.getDownstreamReachableNodes(startNodeId);
    const memo = new Map<string, number>();
    for (const id of this.reachable) this.computeMaxPathPriority(id, memo);
    this.inDegree = this.buildInDegreeMap(this.reachable);
    this.levels = this.computeLevels(startNodeId, this.reachable);
    this.lastExecutedNodeId = null;

    this.pq.clear();

    for (const id of this.reachable) {
      if (this.inDegree.get(id) === 0) {
        const node = this.get(id)!;
        if (node.status === Status.Waiting) this.pq.push(node);
      }
    }

    while (this.pq.size > 0) {
      await this.waitResume();
      if (signal?.aborted) return;

      const node = this.pq.poll()!;
      this.lastExecutedNodeId = node.id;

      const ver = this.nodeVersions.get(node.id) ?? 0;
      if (this.shouldAbort(node.id, ver, signal)) continue;
      if (!this.isReady(node.id)) continue;

      node.status = Status.Running;
      try {
        const depData = this.getDependencyData(node.id);
        await Promise.resolve(node.onLoad(depData, node));
        if (this.shouldAbort(node.id, ver, signal)) continue;
        node.status = Status.Success;
        node.onSuccess?.(depData, node);
      } catch (err) {
        node.status = Status.Failed;
        node.onFailed?.(err as Error, this.getDependencyData(node.id), node);
      } finally {
        node.onFinished?.(this.getDependencyData(node.id), node);
      }

      if (signal?.aborted) return;

      for (const dependentId of node.dependents) {
        if (!this.reachable.has(dependentId)) continue;
        const cnt = this.inDegree.get(dependentId)! - 1;
        this.inDegree.set(dependentId, cnt);
        if (cnt === 0) {
          const depNode = this.get(dependentId)!;
          if (depNode.status === Status.Waiting) {
            this.pq.push(depNode);
          }
        }
      }
    }
  }
}