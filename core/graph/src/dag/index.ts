export enum Status {
  Waiting,
  Running,
  Success,
  Failed
}

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
    const scope = sourceId ? this.getPaths(sourceId) : new Set(this.nodes.keys());

    const degree = new Map<string, number>();
    for (const id of scope) degree.set(id, 0);

    for (const id of scope) {
      const node = this.get(id)!;
      const incomingNodes = direction === 'dependencies' ? node.dependents : node.dependencies;
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
      const outgoingNodes = direction === 'dependencies' ? node.dependencies : node.dependents;
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

  protected hasPath(sourceId: string, targetId: string): boolean {
    return this.getPaths(sourceId).has(targetId);
  }

  protected getPaths(sourceId: string): Set<string> {
    if (this.paths.has(sourceId)) return this.paths.get(sourceId)!
    const visited = new Set<string>()
    this.dfs(sourceId, visited)
    this.paths.set(sourceId, visited)
    return visited
  }

  protected forEach(sourceId: string, callback: (id: string) => boolean | void): void {
    this.traverse(sourceId, callback)
  }

  private cycle(sourceId: string, targetId: string): boolean {
    return this.hasPath(targetId, sourceId);
  }

  private dfs(sourceId: string, visited: Set<string>): void {
    this.traverse(sourceId, id => {
      visited.add(id)
    })
  }

  private traverse(sourceId: string, callback: (id: string) => boolean | void): void {
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

      for (const dep of node.dependencies) {
        if (!visited.has(dep)) stack.push(dep)
      }
    }
  }

  private evict(id: string): void {
    const toDelete: string[] = []
    for (const [key, reachable] of this.paths.entries()) {
      if (key === id || reachable.has(id)) {
        toDelete.push(key)
      }
    }
    for (const key of toDelete) {
      this.paths.delete(key)
    }
  }
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

export class StatefulDAG<D extends any, T extends StatefulNode<D>> extends DAG<T> {
  private version: number = 0;

  private paused: boolean = false;

  private resumeResolvers: (() => void)[] = [];

  public async run(id: string, version: number = this.version, signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) return;
    await this.waitResume();

    if (signal?.aborted || version !== this.version) return;

    const node = this.tryActive(id);
    console.log(node)
    if (node === false) return;

    const depsData = this.getDependencyData(id);

    try {
      await Promise.resolve(node.onLoad(depsData, node));
      if (version !== this.version || signal?.aborted) return;

      node.status = Status.Success;
      node.onSuccess(depsData, node);
    } catch (error) {
      if (version !== this.version || signal?.aborted) return;

      node.status = Status.Failed;
      node.onFailed(error as Error, depsData, node);
    } finally {
      if (version !== this.version || signal?.aborted) return;

      node.onFinished(depsData, node);
    }

    for (const dependentId of node.dependents) {
      await this.run(dependentId, version, signal);
    }
  }

  public async restart(id: string, signal?: AbortSignal) {
    this.version++;

    const affected = this.order(id, 'dependents');
    for (const nodeId of affected) {
      const node = this.get(nodeId);
      if (node) {
        node.status = Status.Waiting;
        node.onReset?.(node);
      }
    }

    await this.run(id, this.version, signal);
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

  private async waitResume(): Promise<void> {
    if (!this.paused) return Promise.resolve();
    return new Promise<void>((resolve) => {
      this.resumeResolvers.push(resolve);
    });
  }

  private tryActive(id: string): false | T {
    const node = this.get(id);

    if (!node || node.status !== Status.Waiting) return false;

    for (const depId of node.dependencies) {
      const dep = this.get(depId);
      console.log(dep, dep!.status !== Status.Success, !dep, "node")

      if (!dep || dep.status !== Status.Success) return false;
    }

    node.status = Status.Running;
    return node;
  }

  private getDependencyData(id: string): Record<string, D> {
    const data: Record<string, D> = {};
    const node = this.get(id);
    if (!node) return data;

    for (const depId of node.dependencies) {
      const depNode = this.get(depId);
      if (depNode && depNode.status === Status.Success && depNode.data !== undefined) {
        data[depId] = depNode.data;
      }
    }
    return data;
  }
}
