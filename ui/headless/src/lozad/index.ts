import { maxBy } from "lodash-es"
import { type Edge, DAG, Dirty, Node } from "@zen-core/graph"
import { PriorityQueue } from "@zen-core/queue"

export interface Schema<T extends Node> {
  nodes: T[],
  edges: Edge<string>[]
}

export interface Options {
  lazy: boolean;
  idleDispatchDelay: number;
  maxConcurrency: number;
  intersectionObserverInit: IntersectionObserverInit;
}

export enum Status {
  Waiting,
  Running,
  Success,
  Failed
}

const WORK_CALL_INTERVAL_LIMIT = 50;

const DEFAULT_OPTIONS: Options = {
  lazy: true,
  maxConcurrency: 1,
  idleDispatchDelay: 50,
  intersectionObserverInit: {
    rootMargin: '200px',
    threshold: 0.1,
  }
}

export class Component extends Node {
  public status: Status = Status.Waiting;

  public constructor(
    public readonly id: string,
    public priority: number = 0
  ) {
    super(id)
  }

  public onLoad() { }

  public onSuccess() { }

  public onFailed() { }

  public onFinished() { }

  public onReset() {
  }
}

export class Worker<T extends Component> {
  public constructor(public readonly scheduler: Scheduler<T>) { }

  public async handle(node: T) {
    try {
      await Promise.resolve(node.onLoad());
      node.status = Status.Success;
      node.onSuccess?.();
    } catch (error) {
      node.status = Status.Failed;
      node.onFailed?.();
    } finally {
      node.onFinished?.();
    }
  }
}

export class Scheduler<T extends Component> extends DAG<T> {
  public readonly queue: PriorityQueue<T> = new PriorityQueue(((a, b) => b._priority - a._priority), false)

  public readonly options: Options

  private workers: Worker<T>[] = [];
  private workersAvail: Worker<T>[] = [];
  private workersBusy: Set<Worker<T>> = new Set();
  private workersStarting = 0;

  private runningEdges: number = 0

  private nextWorkCall: number = 0;
  private workCallTimeout: number | null = null;
  private checkForWorkInterval: number | null = null;

  private lastLaunchedWorkerTime: number = 0;

  private closed: boolean = false;

  private paused: boolean = false;

  private mountedNodes: WeakMap<Element, T> = new WeakMap()
  private inViewportNodes: WeakSet<Element> = new WeakSet()
  private pendingWeightUpdates: Map<T, number> = new Map();
  private weightUpdateScheduled: boolean = false
  private observer: IntersectionObserver;

  public constructor(options: Partial<Options> = {}) {
    super()
    this.options = Object.assign({}, DEFAULT_OPTIONS, options)
    this.observer = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) {
        const node = this.mountedNodes.get(target);
        if (!node) continue;

        if (isIntersecting) {
          if (!this.inViewportNodes.has(target)) {
            this.inViewportNodes.add(target);
            this.batchUpdateWeight(node, 3);
          } else {
            if (this.inViewportNodes.has(target)) {
              this.inViewportNodes.delete(target);
              this.batchUpdateWeight(node, 1);
            }
          }
        }
      }
    }, this.options.intersectionObserverInit)
  }

  public launch() {
    const order = this.order();
    this.queue.push(...order);

    this.work()
  }

  public updateWeight(node: string | T, weight: number = 0): this {
    this.pause();

    const tgtId = this.resolveId(node)
    for (const srcId of this.getInEdges(node)) {
      this.edgeWeights.get(srcId)!.set(tgtId, weight);
    }

    this.markDirty(Dirty.Topo | Dirty.Reach);

    this.order();
    this.queue.rebuild();

    this.resume();
    return this
  }

  public remove(...nodes: (string | T)[]) {
    this.pause();

    for (let node of nodes) {
      node = this.getNode(node)
      const inEdges = this.getInEdges(node);
      const outEdges = this.getOutEdges(node);

      super.removeNode(node);
      this.queue.remove(node)

      for (const srcId of inEdges) {
        for (const tgtId of outEdges) {
          if (srcId === tgtId) continue;
          try {
            this.addEdge(srcId, tgtId, this.edgeWeights.get(node.id)?.get(tgtId) ?? 1);
          } catch {
          }

          const subdag = this.subgraph(tgtId)
          for (const [, node] of subdag.nodes) {
            node.status = Status.Waiting
            this.queue.push(node)
          }
        }
      }
    }

    this.order();
    this.queue.rebuild();

    this.resume();
    return this;
  }

  public push(schema: Schema<T>) {
    this.pause();

    for (const { source, target, weight = 1 } of (schema.edges ?? [])) {
      super.addEdge(source, target, weight);
    }

    for (const node of (schema.nodes ?? [])) {
      const outEdges = this.getOutEdges((node as any).label);

      for (const tgtId of outEdges) {
        const subdag = this.subgraph(tgtId)
        for (const [, n] of subdag.nodes) {
          n.status = Status.Waiting
          this.queue.push(n)
        }
      }

      this.queue.push(this.getNode((node as any).label))
    }

    this.order();
    this.queue.rebuild();

    this.resume();
    return this;
  }

  public pause() {
    this.paused = true;

    if (this.workCallTimeout !== null) {
      clearTimeout(this.workCallTimeout);
      this.workCallTimeout = null;
    }
  }

  public resume() {
    if (!this.paused) return;
    this.paused = false;
    this.work();
  }

  public observe(element: HTMLElement, node: T) {
    this.addNode(node);
    this.mountedNodes.set(element, node)
    this.observer.observe(element)
  }

  public unobserve(element: HTMLElement) {
    const node = this.mountedNodes.get(element)!
    this.removeNode(node)
    this.mountedNodes.delete(element)
    this.observer.unobserve(element)
  }

  private batchUpdateWeight(node: T, weight: number) {
    const existing = this.pendingWeightUpdates.get(node);
    if (existing === weight) return;

    this.pendingWeightUpdates.set(node, weight);

    if (this.weightUpdateScheduled) return;
    this.weightUpdateScheduled = true;

    requestIdleCallback(() => {
      this.pause();

      for (const [node, weight] of this.pendingWeightUpdates) {
        const tgtId = this.resolveId(node)
        for (const srcId of this.getInEdges(node)) {
          this.edgeWeights.get(srcId)?.set(tgtId, weight);
        }
      }

      this.pendingWeightUpdates.clear();
      this.markDirty(Dirty.Topo | Dirty.Reach);

      this.order();
      this.queue.rebuild();
      this.resume();

      this.weightUpdateScheduled = false;
    });
  }

  private async work(node?: T): Promise<void> {
    if (this.paused) return;

    if (this.workCallTimeout === null) {
      const now = Date.now();

      this.nextWorkCall = Math.max(
        this.nextWorkCall + WORK_CALL_INTERVAL_LIMIT,
        now,
      );

      const timeUntilNextWorkCall = this.nextWorkCall - now;
      this.workCallTimeout = setTimeout(
        () => {
          this.workCallTimeout = null;
          this.doWork();
        },
        timeUntilNextWorkCall,
      );
    }
  }

  private async doWork(parent?: T, node?: T) {
    if (this.queue.size === 0) {
      if (this.workersBusy.size === 0) { }
      return;
    }

    node = node ?? this.queue.peek();
    if (!node) {
      // skip, there are items in the queue but they are all delayed
      return;
    }

    if (this.workersAvail.length === 0) {
      if (this.allowedToStartWorker()) {
        await this.launchWorker();
        this.work();
      }
      return;
    }

    node = this.queue.poll()
    const worker = this.workersAvail.shift() as Worker<T>;
    this.workersBusy.add(worker);

    if (this.workersAvail.length !== 0 || this.allowedToStartWorker()) {
      if (parent) {
        const edges = this.getOutEdges(parent)
        const allowNode = maxBy(
          Array.from(edges).filter(edge => edge !== node.id)
            .map(this.getNode), (node: T) => node._priority
        )
        if (allowNode && this.runningEdges < this.options.maxConcurrency) {
          this.runningEdges++
          this.queue.remove(allowNode)
          this.work(parent, allowNode);
        }
      }
    }

    await worker.handle(node);

    this.workersBusy.delete(worker);
    this.workersAvail.push(worker);

    this.work();
  }

  private launchWorker() {
    this.workersStarting += 1;

    const worker = new Worker<T>(this);
    this.workers.push(worker);
    this.workersAvail.push(worker);

    this.workersStarting -= 1;

  }

  private allowedToStartWorker(): boolean {
    const workerCount = this.workers.length + this.workersStarting;
    return (this.options.maxConcurrency === 0
      || workerCount < this.options.maxConcurrency)
  }
}