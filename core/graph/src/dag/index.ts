import { PriorityQueue } from "@zen-core/queue";

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

      const neighbors = direction === 'dependencies' ? node.dependencies : node.dependents;
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }

  protected evict(id: string): void {
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
    if (this.pause) {
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

  protected async _run(id: string, version?: number, signal?: AbortSignal, rootId: string = id): Promise<void> {
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
}

export class PriorityNode<T> extends StatefulNode<T> {
  public priority: number = 0;
}

export class PriorityDAG<D, T extends PriorityNode<D>> extends StatefulDAG<D, T> {
  public static options: PriorityDAGOptions = {
    maxConcurrency: 3
  }

  private readonly options: PriorityDAGOptions

  protected readonly queue: PriorityQueue<T> = new PriorityQueue((a, b) => b.priority - a.priority);

  private readonly queuedIds: Set<string> = new Set();

  private runningCount = 0;
  private workCallTimeout: any = null;
  private nextWorkCall = 0;
  public readonly WORK_CALL_INTERVAL_LIMIT: number = 100;

  public constructor(options: Partial<PriorityDAGOptions> = {}) {
    super()

    this.options = Object.assign({}, PriorityDAG.options, options);
  }

  private enqueue(node: T) {
    if (this.queuedIds.has(node.id)) return;
    this.queuedIds.add(node.id);
    this.queue.push(node);
  }

  private dequeue(): T | undefined {
    const node = this.queue.poll();
    if (node) this.queuedIds.delete(node.id);
    return node;
  }

  public async run(id: string, version?: number, signal?: AbortSignal) {
    const node = this.get(id);
    if (!node) return;

    if (this.isFinished(id)) return; // 任务已完成
    if (!this.isReady(id)) return;   // 依赖未满足

    this.enqueue(node);
    this.scheduleWork();
  }

  private scheduleWork() {
    if (this.workCallTimeout) return;

    const now = Date.now();
    this.nextWorkCall = Math.max(this.nextWorkCall + this.WORK_CALL_INTERVAL_LIMIT, now);
    const delay = this.nextWorkCall - now;

    this.workCallTimeout = setTimeout(() => {
      this.workCallTimeout = null;
      this.doWork();
    }, delay);
  }


  private async doWork() {
    while (this.runningCount < this.options.maxConcurrency && this.queue.size > 0) {
      const node = this.dequeue();
      if (!node) break;

      if (this.isFinished(node.id)) continue;

      if (!this.isReady(node.id)) {
        // 依赖未满足，重新入队尾
        this.enqueue(node);
        break;
      }

      this.runningCount++;
      this._run(node.id, this.nodeVersions.get(node.id), undefined, node.id)
        .finally(() => {
          this.runningCount--;
          this.scheduleWork();
        });
    }
  }

  // 重写 _run，去除递归，依赖由调度器负责执行
  protected override async _run(id: string, version?: number, signal?: AbortSignal, rootId: string = id): Promise<void> {
    const nodeVersion = this.nodeVersions.get(id) ?? 0;
    if (version === undefined) version = nodeVersion;

    if (this.shouldAbort(id, version, signal)) return;
    await this.waitResume();
    if (this.shouldAbort(id, version, signal)) return;

    const node = this.get(id);
    if (!node) return;

    // 依赖不满足，放弃执行，调度器会处理
    for (const depId of node.dependencies) {
      const depNode = this.get(depId);
      if (!depNode || depNode.status !== Status.Success) {
        return;
      }
    }

    const activeNode = this.tryActive(id);
    if (activeNode === false) return;

    const depsData = this.getDependencyData(id);

    try {
      await Promise.resolve(activeNode.onLoad?.(depsData, activeNode));
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

    // 执行完后，将所有依赖当前节点的节点入队，等待调度
    for (const dependentId of activeNode.dependents) {
      const dependentNode = this.get(dependentId);
      if (!dependentNode) continue;

      if (!this.queuedIds.has(dependentId) && !this.isFinished(dependentId)) {
        this.enqueue(dependentNode);
      }
    }
  }
}