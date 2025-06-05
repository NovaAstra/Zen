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

  public addNode(node: T, override: boolean = false): void {
    if (!this.has(node.id) || override) {
      this.nodes.set(node.id, node);
      this.paths.clear();
    };
  }

  public getNode(id: string): T {
    return this.nodes.get(id);
  }

  public has(id: string): boolean {
    return this.nodes.has(id);
  }

  public delete(id: string): boolean {
    if (!this.has(id)) return false;

    const node = this.nodes.get(id)!;

    for (const depId of node.dependencies) {
      this.nodes.get(depId)?.dependents.delete(id);
    }

    for (const dependentId of node.dependents) {
      this.nodes.get(dependentId)?.dependencies.delete(id);
    }

    this.paths.clear();
    return this.nodes.delete(id);
  }

  public clear(): void {
    this.nodes.clear();
    this.paths.clear();
  }

  public addDependency(sourceId: string, targetId: string): boolean {
    const source = this.getNode(sourceId);
    const target = this.getNode(targetId);

    if (!source || !target) return false;
    if (this.wouldCreateCycle(sourceId, targetId)) return false

    source.dependencies.add(targetId);
    target.dependents.add(sourceId);

    this.paths.clear();
    return true;
  }

  public deleteDependency(sourceId: string, targetId: string): boolean {
    const source = this.nodes.get(sourceId);
    const target = this.nodes.get(targetId);

    if (!source || !target || !source.dependencies.has(targetId)) return false;

    source.dependencies.delete(targetId);
    target.dependents.delete(sourceId);

    this.paths.clear();
    return true;
  }

  public order(sourceId?: string, direction: Direction = 'dependencies', topo: boolean = true): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const stack = new Set<string>();

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      stack.add(id);

      const node = this.getNode(id);
      if (!node) return;

      const edges = direction === 'dependencies' ? node.dependencies : node.dependents;
      for (const nextId of edges) {
        if (!stack.has(nextId)) visit(nextId);
      }

      stack.delete(id);
      result.push(id);
    };

    if (sourceId) {
      visit(sourceId);
    } else {
      for (const id of this.nodes.keys()) {
        visit(id);
      }
    }

    return topo ? result.reverse() : result;
  }

  protected hasPath(sourceId: string, targetId: string): boolean {
    return this.getPaths(sourceId).has(targetId);
  }

  protected getPaths(sourceId: string): Set<string> {
    if (this.paths.has(sourceId)) return this.paths.get(sourceId)!;

    const visited = new Set<string>();
    this.forEach(sourceId, i => { visited.add(i) });

    this.paths.set(sourceId, visited);
    return visited;
  }

  protected forEach(sourceId: string, callback: (id: string) => boolean | void): void {
    this.dfs(sourceId, new Set(), new Set(), callback);
  }

  private wouldCreateCycle(sourceId: string, targetId: string): boolean {
    return this.hasPath(targetId, sourceId);
  }

  private dfs(
    id: string,
    visited: Set<string>,
    stack: Set<string>,
    callback: (id: string) => boolean | void
  ): boolean {
    if (visited.has(id)) return;
    visited.add(id);
    stack.add(id);

    const node = this.getNode(id);
    if (node) {
      for (const dep of node.dependencies) {
        if (stack.has(dep)) return true;
        if (this.dfs(dep, visited, stack, callback)) return true;
      }
    }

    callback(id);
    stack.delete(id);
    return false;
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

  public async run(id: string, version: number = this.version, signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) return;

    const node = this.tryActive(id);
    if (node === false || version !== this.version) return;

    const depsData = this.getDependencyData(id);

    try {
      await Promise.resolve(node.onLoad(depsData, node));
      if (version !== this.version || signal?.aborted) return;

      node.status = Status.Success;
      node.onSuccess(depsData, node);
    } catch (error) {
      if (version !== this.version || signal?.aborted) return;

      node.status = Status.Failed;
      node.onFailed(error, depsData, node);
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
      const node = this.getNode(nodeId);
      if (node) {
        node.status = Status.Waiting;
        node.onReset?.(node);
      }
    }

    await this.run(id, this.version, signal);
  }

  private tryActive(id: string): false | T {
    const node = this.getNode(id);
    if (!node || node.status !== Status.Waiting) return false;

    for (const depId of node.dependencies) {
      const dep = this.getNode(depId);
      if (!dep || dep.status !== Status.Success) return false;
    }

    node.status = Status.Running;
    return node;
  }

  private getDependencyData(id: string): Record<string, D> {
    const data: Record<string, D> = {};
    const node = this.getNode(id);
    if (!node) return data;

    for (const depId of node.dependencies) {
      const depNode = this.getNode(depId);
      if (depNode && depNode.status === Status.Success && depNode.data !== undefined) {
        data[depId] = depNode.data;
      }
    }
    return data;
  }
}
