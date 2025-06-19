import { type Node as _Node, DAG, Dirty } from "@zen-core/graph"
import { PriorityQueue } from "@zen-core/queue"

export const microtask: (fn: () => void) => void =
  typeof queueMicrotask === "function"
    ? queueMicrotask
    : (fn) => {
      Promise.resolve().then(fn);
    };

export class Scroller {
  private timeoutId?: number;
  private scrolling: boolean = false;

  public constructor(private options: {
    onScrollStart?: () => void,
    onScrollEnd: () => void,
    settleTime: number
  }) {
    requestIdleCallback(() => {
      window.addEventListener('scroll', this.onScroll, {
        capture: true,
        passive: true,
      });
    }, { timeout: 10 })
  }

  public dispose() {
    window.removeEventListener('scroll', this.onScroll, {
      capture: true,
    });
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    };
  }

  private onScroll = this._onScroll.bind(this);

  private _onScroll() {
    if (!this.scrolling && this.options.onScrollStart) {
      this.options.onScrollStart();
      this.scrolling = true;
    }

    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = window.setTimeout(() => {
      this.options.onScrollEnd()
      this.scrolling = false;
    }, this.options.settleTime);
  }
}

export class Observer<T> {
  public mounted: WeakMap<Element, T> = new WeakMap();
  private observer: IntersectionObserver;

  public constructor(options: {
    intersectionObserverInit: IntersectionObserverInit,
    onVisible: (entries: IntersectionObserverEntry[]) => void
  }) {
    this.observer = new IntersectionObserver(options.onVisible, options.intersectionObserverInit)
  }

  public observe(element: Element, input: T) {
    if (!element || this.mounted.has(element)) return
    this.mounted.set(element, input);
    this.observer?.observe(element)
  }

  public unobserve(element: Element) {
    this.observer?.unobserve(element)
    this.mounted.delete(element);
  }

  public dispose() {
    this.observer?.disconnect()
    this.mounted = new WeakMap();
  }

  public get(element: Element): T {
    return this.mounted.get(element)!;
  }

  public has(element: Element): boolean {
    return this.mounted.has(element);
  }
}

export class Worker<T extends Node> {
  public constructor(public readonly scheduler: Scheduler<T>) { }

  public async handle(node: T) {
    try {
      node.loading = true
      node.onLoad?.();
      await Promise.resolve(node.onSetup());
      node.status = Status.Success;
      node.onSuccess?.();
    } catch (error) {
      node.status = Status.Failed;
      node.onFailed?.();
    } finally {
      node.onFinished?.();
      node.loading = false
    }
  }
}

export enum Status {
  Waiting,
  Running,
  Success,
  Failed
}


export interface Options {
  maxConcurrency: number;
  settleTime: number;
  timeout: number;
  intersectionObserverInit: IntersectionObserverInit;
}

export interface Node extends _Node {
  visible: boolean;
  loading: boolean;
  status: Status;

  onSetup(): void;

  onLoad?(): void;
  onSuccess?(): void;
  onFailed?(): void;
  onFinished?(): void;

  onReset?(): void;
}

export interface GridItem {
  i: string;
  com: string;
}

const DEFAULT_OPTIONS: Options = {
  maxConcurrency: 3,
  settleTime: 50,
  timeout: 20,
  intersectionObserverInit: {
    threshold: 0.1,
  }
}

const CHECK_FOR_WORK_INTERVAL = 100;

export class Scheduler<T extends Node> extends DAG<T> {
  public readonly options: Options;

  private readonly observer: Observer<T>;
  private readonly scroller: Scroller;

  public readonly queue: PriorityQueue<T> = new PriorityQueue(((a, b) => {
    if (a._priority !== b._priority) return b._priority! - a._priority!;
    return a._level! - b._level!;
  }), false)

  private shouldSync: boolean = false
  private scrolling: boolean = false;
  private paused: boolean = false;
  private initialized: boolean = false;

  private seen: Set<Element> = new Set();
  private updated: Map<Element, [number, boolean]> = new Map();

  private counts: number = 0

  private checkForWorkInterval: number;

  private nextWorkCall: number = 0;
  private workCallTimeout: number | null = null;

  private workers: Worker<T>[] = [];
  private workersAvail: Worker<T>[] = [];
  private workersBusy: Set<Worker<T>> = new Set();
  private workersStarting = 0;

  public constructor(options: Partial<Options> = {}) {
    super()
    this.options = Object.assign({}, DEFAULT_OPTIONS, options)
    this.observer = new Observer<T>({
      intersectionObserverInit: this.options.intersectionObserverInit,
      onVisible: this.onVisible
    });
    this.scroller = new Scroller({
      onScrollStart: this.onScrollStart,
      onScrollEnd: this.onScrollEnd,
      settleTime: this.options.settleTime
    })

    this.checkForWorkInterval = setInterval(() => this.check(), CHECK_FOR_WORK_INTERVAL);
  }

  public launch(items: GridItem[]): this {
    if (this.initialized) return this;
    this.counts = items.length;
    return this;
  }

  public pause() {
    this.paused = true;
  }

  public reset(input: T) {
    if (!this.isDepFinished(input)) return

    this.pause();
    const subdag = this.subgraph(input)

    for (const [, node] of subdag.nodes) {
      node.loading = true;
      if (node.visible) node.priority = Math.max(10, node.priority ?? 1)
      this.queue.push(node)
    }

    this.markDirty(Dirty.Topo | Dirty.Reach);

    this.order();
    this.queue.rebuild();

    this.resume()
  }

  public resume() {
    if (!this.paused || !this.initialized) return;
    this.paused = false;
  }

  public observe(element: Element, input: T) {
    this.addNode(input)
    this.observer.observe(element, input)
  }

  public unobserve(element: Element) {
    this.removeNode(this.observer.get(element))
    this.observer.unobserve(element)
  }

  public close() {
    this.initialized = false
    this.paused = false

    this.observer.dispose()
    this.scroller.dispose()
  }

  private onUpdate = this._onUpdate.bind(this);
  private onScrollStart = this._onScrollStart.bind(this);
  private onScrollEnd = this._onScrollEnd.bind(this);
  private onVisible = this._onVisible.bind(this)

  private check() {
    if (!this.initialized && this.size === this.counts && Math.max(this.size, this.counts) > 0) {
      const order = this.order()
      this.queue.push(...order)
      this.initialized = true
    }

    this.work()
  }

  private work(node?: T) {
    if (!this.initialized) return;
    if (this.paused) return;
    if (this.workCallTimeout === null) {
      const now = Date.now();

      this.nextWorkCall = Math.max(
        this.nextWorkCall + this.options.timeout,
        now,
      );

      const timeUntilNextWorkCall = this.nextWorkCall - now;
      this.workCallTimeout = requestIdleCallback(
        () => {
          this.workCallTimeout = null;
          this.doWork(node);
        },
        { timeout: timeUntilNextWorkCall },
      );
    }
  }

  private async doWork(current?: T) {
    if (this.queue.size === 0 && !current) {
      if (this.workersBusy.size === 0) { }
      return;
    }

    if (this.workersAvail.length === 0) {
      if (this.shouldCreate()) {
        await this.create();
        this.work(current);
      }
      return
    }

    let node = current ?? this.queue.peek();
    if (node === undefined || !this.isDepFinished(node)) {
      // skip, there are items in the queue but they are all delayed
      return;
    }
    if (!current) node = this.queue.poll()

    const worker = this.workersAvail.shift() as Worker<T>;
    this.workersBusy.add(worker);

    if (this.workersAvail.length !== 0 || this.shouldCreate()) {
      // we can execute more work in parallel
      const n = this.getNextNode()
      this.queue.remove(n)
      if (n) this.work(n);
    }

    await worker.handle(node)

    this.workersBusy.delete(worker);
    this.workersAvail.push(worker);

    this.work();
  }

  private async create() {
    this.workersStarting += 1;

    const worker = new Worker<T>(this);
    this.workers.push(worker);
    this.workersAvail.push(worker);

    this.workersStarting -= 1;
  }

  private shouldCreate() {
    const workerCount = this.workers.length + this.workersStarting;
    return (this.options.maxConcurrency === 0
      || workerCount < this.options.maxConcurrency)
  }

  private getNextNode(): T {
    let node: T | undefined = undefined
    for (const n of this.queue) {
      if (this.isDepFinished(n)) {
        node = n
        break
      }
    }
    return node as T
  }

  private isDepFinished(node: T): boolean {
    const edges = this.getInEdges(node)

    let finished = true
    for (const srcId of edges) {
      const source = this.getNode(srcId);
      if (source.status === Status.Waiting || source.status === Status.Running) {
        finished = false
        break
      }
    }
    return finished
  }

  private _onUpdateWeight(inputs: T[]) {
    this.markDirty(Dirty.Topo | Dirty.Reach);

    this.order();
    this.queue.rebuild();
  }

  private _onUpdate() {
    if (this.shouldSync || this.scrolling || this.updated.size === 0) return;

    if (this.initialized) this.pause();

    microtask(() => {
      if (!this.shouldSync && !this.scrolling && this.updated.size > 0) {
        const inputs: T[] = []
        for (const [target, [priority, visible]] of this.updated) {
          if (!this.observer.mounted.has(target)) continue;
          const input = this.observer.mounted.get(target)!;
          input.priority = priority + (input.priority ?? 1)
          if (!input.visible && visible) {
            input.visible = true;
          }
          inputs.push(input)
        }

        this._onUpdateWeight(inputs)

        this.updated.clear()
      }

      this.resume()
    })
  }

  private _onScrollStart() {
    this.scrolling = true
  }

  private _onScrollEnd() {
    this.scrolling = false
    if (!this.shouldSync && !this.scrolling) {
      this.onUpdate();
    }
  }

  private _onVisible(entries: IntersectionObserverEntry[]) {
    this.shouldSync = true

    for (const { target, isIntersecting } of entries) {
      if (!(target as HTMLElement).offsetParent) continue;

      const isSeen = this.seen.has(target);

      if (isIntersecting) {
        if (isSeen) continue
        this.updated.set(target, [3, true])
        continue
      }
      if (!isSeen) {
        if (this.updated.has(target)) this.updated.delete(target)
        continue
      }
      this.updated.set(target, [1, false])
    }

    this.shouldSync = false
    if (!this.scrolling && !this.shouldSync) {
      this.onUpdate()
    }
  }
}

