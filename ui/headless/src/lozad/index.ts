import { type Edge, DAG, Dirty, Node } from "@zen-core/graph"
import { PriorityQueue } from "@zen-core/queue"

export interface Schema<T extends Node> {
  nodes: T[],
  edges: Edge<string>[]
}

export interface MetaData {

}

export enum Status {
  Waiting,
  Running,
  Success,
  Failed
}

const CHECK_FOR_WORK_INTERVAL = 100;
const WORK_CALL_INTERVAL_LIMIT = 50;


export class Component<P = unknown> extends Node {
  public status: Status = Status.Waiting;

  public constructor(
    public readonly id: string,
    public priority: number = 0,
    public metadata?: P
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

export class Worker<P, T extends Component<P>> {
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

export class Scheduler<P, T extends Component<P>> extends DAG<T> {
  public readonly queue: PriorityQueue<T> = new PriorityQueue(((a, b) => b._priority - a._priority), false)

  private workers: Worker<P, T>[] = [];
  private workersAvail: Worker<P, T>[] = [];
  private workersBusy: Set<Worker<P, T>> = new Set();
  private workersStarting = 0;

  private readonly mountedNodes: WeakMap<HTMLElement, T> = new Map()

  private nextWorkCall: number = 0;
  private workCallTimeout: number | null = null;
  private checkForWorkInterval: number | null = null;

  private lastLaunchedWorkerTime: number = 0;

  private closed: boolean = false;

  private paused: boolean = false;

  private readonly observer: IntersectionObserver = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) { }
  })

  public constructor() {
    super(Component)
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
    this.mountedNodes.set(element, node)
    this.observer.observe(element)
  }

  public unobserve(element: HTMLElement) {
    this.mountedNodes.delete(element)
    this.observer.unobserve(element)
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
          this.doWork(node);
        },
        timeUntilNextWorkCall,
      );
    }
  }

  private async doWork(node?: T) {
    if (this.queue.size === 0 && !node) {
      if (this.workersBusy.size === 0) { }
      return;
    }

    if (this.workersAvail.length === 0 && !node) {
      const next = this.queue.peek();
      if (this.allowedToStartWorker(next)) {
        await this.launchWorker();
        this.work();
      }
      return;
    }

    node = node ?? this.queue.poll();
    if (!node) {
      // skip, there are items in the queue but they are all delayed
      return;
    }

    if (this.workersAvail.length === 0) {
      if (this.allowedToStartWorker(node)) {
        await this.launchWorker();
        this.work(node);
      }
      return;
    }

    const worker = this.workersAvail.shift() as Worker<P, T>;
    this.workersBusy.add(worker);

    if (this.workersAvail.length !== 0 || this.allowedToStartWorker(node)) {
      this.work();
    }

    await worker.handle(node);

    this.workersBusy.delete(worker);
    this.workersAvail.push(worker);

    this.work();
  }

  private launchWorker() {
    this.workersStarting += 1;

    const worker = new Worker<P, T>();
    this.workers.push(worker);
    this.workersAvail.push(worker);
    this.workersStarting -= 1;

  }

  private allowedToStartWorker(node: T): boolean {
    const workerCount = this.workers.length + this.workersStarting;
    return workerCount < 1
  }
}