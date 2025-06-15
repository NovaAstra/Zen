import { DAG, Direction, Node } from "@zen-core/graph"
import { PriorityQueue } from "@zen-core/queue"

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
  public readonly queue: PriorityQueue<T> = new PriorityQueue((a, b) => b._priority - a._priority)

  private workers: Worker<P, T>[] = [];
  private workersAvail: Worker<P, T>[] = [];
  private workersBusy: Set<Worker<P, T>> = new Set();
  private workersStarting = 0;

  private nextWorkCall: number = 0;
  private workCallTimeout: number | null = null;
  private checkForWorkInterval: number | null = null;

  private lastLaunchedWorkerTime: number = 0;

  private closed: boolean = false;

  private paused: boolean = false;

  public run(node: string | T) {
    const order = this.order(node);
    this.queue.push(...order);

    this.work()
  }

  public updateWeight(node: T, weight: number = 0): this {
    this.pause();

    const tgtId = this.resolveId(node)
    for (const srcId of this.getInEdges(node)) {
      this.edgeWeights.get(srcId)!.set(tgtId, weight);
    }
    this.queue.clear()
    const order = this.order();
    this.queue.push(...order);

    this.resume();
    return this
  }

  public pause() {
    this.paused = true;
  }

  public resume() {
    this.paused = false;
  }

  private async work(node?: T): Promise<void> {
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