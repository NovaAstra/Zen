export type Direction = 'dependencies' | 'dependents'

export class Node {
  public readonly dependencies: Set<string> = new Set();
  public readonly dependents: Set<string> = new Set();

  public constructor(public readonly id: string) { }
}

export class DAG<T extends Node> {
  private readonly nodes: Map<string, T> = new Map();
  private readonly paths: Map<string, Set<string>> = new Map();

  public get size(): number {
    return this.nodes.size;
  }

  public add(node: T, override: boolean = false): void {
    if (!this.has(node.id) || override) {
      this.nodes.set(node.id, node);
      this.evict(node.id);
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

    this.evict(node.id);
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

    this.paths.clear();
    return true;
  }


  public unlink(sourceId: string, targetId: string): boolean {
    const source = this.nodes.get(sourceId);
    const target = this.nodes.get(targetId);

    if (!source || !target) return false;
    if (!source.dependencies.has(targetId)) return false;

    source.dependencies.delete(targetId);
    target.dependents.delete(sourceId);

    this.paths.clear();
    return true;
  }

  public order(sourceId?: string, direction: Direction = 'dependencies'): string[] {
    const scope = sourceId ? this.getPaths(sourceId, direction) : new Set(this.nodes.keys());

    const degree = new Map<string, number>();
    for (const id of scope) degree.set(id, 0);

    for (const id of scope) {
      const node = this.get(id)!;
      const incomingNodes = direction === 'dependencies' ? node.dependencies : node.dependents;
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
      const outgoingNodes = direction === 'dependencies' ? node.dependents : node.dependencies;
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
      const links = direction === 'dependencies' ? node.dependencies : node.dependents;
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
    const cacheKey = `${direction}:${sourceId}`;
    if (this.paths.has(cacheKey)) return this.paths.get(cacheKey)!;

    const visited = new Set<string>()
    this.traverse(sourceId, id => { visited.add(id) }, direction);

    visited.delete(sourceId);
    this.paths.set(cacheKey, visited);
    return visited
  }

  public forEach(sourceId: string, callback: (id: string) => boolean | void): void {
    this.traverse(sourceId, callback)
  }

  private cycle(sourceId: string, targetId: string): boolean {
    return this.hasPath(targetId, sourceId);
  }

  private traverse(sourceId: string, callback: (id: string) => boolean | void, direction: Direction = 'dependencies'): void {
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

      const neighbors = direction === 'dependencies' ? node.dependencies : node.dependents;
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }

  private evict(id: string): void {
    const toDelete: string[] = [];
    for (const [key, reachable] of this.paths.entries()) {
      const [, source] = key.split(':');
      if (source === id || reachable.has(id)) {
        toDelete.push(key);
      }
    }
    for (const key of toDelete) {
      this.paths.delete(key);
    }
  }
}

export enum Status {
  Waiting,
  Running,
  Success,
  Failed
}

export class StatefulNode<T = any> extends Node {
  public status: Status = Status.Waiting;

  public constructor(
    public readonly id: string,
    public name?: string,
    public data?: T
  ) {
    super(id)
  }

  public onLoad(data: Record<string, T>, node: Node) { }

  public onSuccess(data: Record<string, T>, node: Node) { }

  public onFailed(error: Error, data: Record<string, T>, node: Node) { }

  public onFinished(data: Record<string, T>, node: Node) { }

  public onReset(node: Node): void { }
}

export class StatefulDAG<D, T extends StatefulNode<D>> extends DAG<T> {
  protected readonly nodeVersions: Map<string, number> = new Map();

  protected paused: boolean = false;

  protected resumeResolvers: (() => void)[] = [];

  public async run(id: string, version?: number, signal?: AbortSignal): Promise<void> {
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
        await this.run(depId, this.nodeVersions.get(depId), signal);
        if (this.shouldAbort(id, version, signal)) return;

        const depNodeAfterRun = this.get(depId);
        if (!depNodeAfterRun || depNodeAfterRun.status !== Status.Success) return;
      }
    }

    const activeNode = this.tryActive(id);
    if (activeNode === false) return;

    const depsData = this.getDependencyData(id);

    try {
      await Promise.resolve(activeNode.onLoad(depsData, activeNode));
      if (this.shouldAbort(id, version, signal)) return;

      activeNode.status = Status.Success;
      activeNode.onSuccess?.(depsData, activeNode);
    } catch (error) {
      if (this.shouldAbort(id, version, signal)) return;

      activeNode.status = Status.Failed;
      activeNode.onFailed?.(error as Error, depsData, activeNode);
    } finally {
      if (this.shouldAbort(id, version, signal)) return;

      activeNode.onFinished?.(depsData, activeNode);
    }

    const tasks: Promise<void>[] = []
    for (const dependentId of activeNode.dependents) {
      tasks.push(this.run(dependentId, this.nodeVersions.get(dependentId), signal))
    }
    await Promise.all(tasks);
  }

  public async restart(id: string, signal?: AbortSignal) {
    const upstream = this.order(id, 'dependents');
    upstream.push(id);

    for (const nodeId of upstream) {
      const oldVer = this.nodeVersions.get(nodeId) ?? 0;
      this.nodeVersions.set(nodeId, oldVer + 1);
    }

    for (const nodeId of upstream) {
      const node = this.get(nodeId);
      if (node) {
        node.status = Status.Waiting;
        node.onReset?.(node);
      }
    }

    for (const nodeId of upstream) {
      await this.run(nodeId, this.nodeVersions.get(nodeId), signal);
    }
  }

  public pause(): void {
    this.paused = true;
  }

  public resume() {
    if (!this.paused) return;
    this.paused = false;
    for (const resolve of this.resumeResolvers) resolve();
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
}


export class Scheduler<D, T extends StatefulNode<D>> extends StatefulDAG<D, T> {
  constructor() {
    super();
  }
}
