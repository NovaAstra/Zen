export enum Status {
  Waiting,
  Running,
  Success,
  Failed
}

export class Node {
  public readonly dependencies: Set<string> = new Set();
  public readonly dependents: Set<string> = new Set();

  public constructor(public readonly id: string) { }
}

export class DAG<T extends Node> {
  private readonly nodes: Map<string, T> = new Map();

  public get size(): number {
    return this.nodes.size;
  }

  public addNode(node: T, override: boolean = false): void {
    if (!this.has(node.id) || override) this.nodes.set(node.id, node);
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

    return this.nodes.delete(id);
  }

  public clear(): void {
    this.nodes.clear();
  }

  public addDependency(sourceId: string, targetId: string): boolean {
    const source = this.getNode(sourceId);
    const target = this.getNode(targetId);

    if (!source || !target) return false;

    if (this.wouldCreateCycle(sourceId, targetId)) return false

    source.dependencies.add(targetId);
    target.dependents.add(sourceId);
    return true;
  }

  public deleteDependency(sourceId: string, targetId: string): boolean {
    const source = this.nodes.get(sourceId);
    const target = this.nodes.get(targetId);

    if (!source || !target) return false;
    if (!source.dependencies.has(targetId)) return false;

    source.dependencies.delete(targetId);
    target.dependents.delete(sourceId);
    return true;
  }

  public topologicalOrder(): T[] {
    const inDegree = new Map<string, number>();
    const result: T[] = [];
    const queue: string[] = [];

    // 初始化入度表
    for (const [id, node] of this.nodes) {
      inDegree.set(id, node.dependencies.size);
    }

    // 收集所有入度为 0 的节点
    for (const [id, degree] of inDegree.entries()) {
      if (degree === 0) queue.push(id);
    }

    // 拓扑排序
    while (queue.length > 0) {
      const id = queue.shift()!;
      const node = this.nodes.get(id)!;
      result.push(node);

      for (const dependentId of node.dependents) {
        const count = inDegree.get(dependentId)! - 1;
        inDegree.set(dependentId, count);
        if (count === 0) queue.push(dependentId);
      }
    }

    // 检查是否存在环（即结果长度不等于节点数）
    if (result.length !== this.size) {
      throw new Error("Graph contains a cycle");
    }

    return result;
  }

  private wouldCreateCycle(sourceId: string, targetId: string): boolean {
    return this.hasPath(targetId, sourceId);
  }

  private hasPath(sourceId: string, targetId: string): boolean {
    if (sourceId === targetId) return true;

    const visited = new Set<string>();
    const stack: string[] = [sourceId];

    while (stack.length) {
      const id = stack.pop()!;
      if (id === targetId) return true;
      if (visited.has(id)) continue;
      visited.add(id);

      const node = this.getNode(id);
      if (!node || node.dependencies.size === 0) continue;

      for (const depId of node.dependencies) {
        if (!visited.has(depId)) stack.push(depId);
      }
    }
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

  public onLoad(data: Record<string, T>) { }

  public onSuccess() { }

  public onFailed() { }

  public onFinished() { }
}

export class StatefulDAG<D extends any, T extends StatefulNode<D>> extends DAG<T> {
  public async run(id: string): Promise<void> {
    const node = this.tryActive(id);
    if (node === false) return

    try {
      const depsData = this.getDependencyData(id);
      await Promise.resolve(node.onLoad(depsData));
      node.status = Status.Success;
      node.onSuccess();
    } catch (err) {
      node.status = Status.Failed;
      node.onFailed();
    } finally {
      node.onFinished();
    }

    for (const dependentId of node.dependents) {
      this.run(dependentId);
    }
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
    const node = this.getNode(id);
    if (!node) return {};
    const data: Record<string, D> = {};
    for (const depId of node.dependencies) {
      const depNode = this.getNode(depId);
      if (depNode && depNode.status === Status.Success && depNode.data !== undefined) {
        data[depId] = depNode.data;
      }
    }
    return data;
  }
}
