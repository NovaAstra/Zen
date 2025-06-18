import { type Node as _Node, DAG, Dirty } from "@zen-core/graph"
import { PriorityQueue } from "@zen-core/queue"

// export interface Schema<T extends Node> {
//   nodes: T[],
//   edges: Edge<string>[]
// }

// export interface Options {
//   lazy: boolean;
//   idleDispatchDelay: number;
//   maxConcurrency: number;
//   intersectionObserverInit: IntersectionObserverInit;
// }

// export enum Status {
//   Waiting,
//   Running,
//   Success,
//   Failed
// }

// const WORK_CALL_INTERVAL_LIMIT = 50;

// const DEFAULT_OPTIONS: Options = {
//   lazy: true,
//   maxConcurrency: 1,
//   idleDispatchDelay: 50,
//   intersectionObserverInit: {
//     rootMargin: '200px',
//     threshold: 0.1,
//   }
// }

// export class Component extends Node {
//   public status: Status = Status.Waiting;

//   public constructor(
//     public readonly id: string,
//     public priority: number = 0
//   ) {
//     super(id)
//   }

//   public onLoad() { }

//   public onSuccess() { }

//   public onFailed() { }

//   public onFinished() { }

//   public onReset() {
//   }
// }

// export class Worker<T extends Component> {
//   public constructor(public readonly scheduler: Scheduler<T>) { }

//   public async handle(node: T) {
//     try {
//       await Promise.resolve(node.onLoad());
//       node.status = Status.Success;
//       node.onSuccess?.();
//     } catch (error) {
//       node.status = Status.Failed;
//       node.onFailed?.();
//     } finally {
//       node.onFinished?.();
//     }
//   }
// }

// export class Scheduler<T extends Component> extends DAG<T> {
//   public readonly queue: PriorityQueue<T> = new PriorityQueue(((a, b) => b._priority - a._priority), false)

//   public readonly options: Options

//   private workers: Worker<T>[] = [];
//   private workersAvail: Worker<T>[] = [];
//   private workersBusy: Set<Worker<T>> = new Set();
//   private workersStarting = 0;

//   private runningEdges: number = 0

//   private nextWorkCall: number = 0;
//   private workCallTimeout: number | null = null;
//   private checkForWorkInterval: number | null = null;

//   private lastLaunchedWorkerTime: number = 0;

//   private closed: boolean = false;

//   private paused: boolean = false;

//   private mountedNodes: WeakMap<Element, T> = new WeakMap()
//   private inViewportNodes: WeakSet<Element> = new WeakSet()
//   private pendingWeightUpdates: Map<T, number> = new Map();
//   private weightUpdateScheduled: boolean = false
//   private observer: IntersectionObserver;

//   public constructor(options: Partial<Options> = {}) {
//     super()
//     this.options = Object.assign({}, DEFAULT_OPTIONS, options)
//     this.observer = new IntersectionObserver((entries) => {
//       for (const { target, isIntersecting } of entries) {
//         const node = this.mountedNodes.get(target);
//         if (!node) continue;

//         if (isIntersecting) {
//           if (!this.inViewportNodes.has(target)) {
//             this.inViewportNodes.add(target);
//             this.batchUpdateWeight(node, 3);
//           } else {
//             if (this.inViewportNodes.has(target)) {
//               this.inViewportNodes.delete(target);
//               this.batchUpdateWeight(node, 1);
//             }
//           }
//         }
//       }
//     }, this.options.intersectionObserverInit)
//   }

//   public launch() {
//     const order = this.order();
//     this.queue.push(...order);

//     this.work()
//   }

//   public updateWeight(node: string | T, weight: number = 0): this {
//     this.pause();

//     const tgtId = this.resolveId(node)
//     for (const srcId of this.getInEdges(node)) {
//       this.edgeWeights.get(srcId)!.set(tgtId, weight);
//     }

//     this.markDirty(Dirty.Topo | Dirty.Reach);

//     this.order();
//     this.queue.rebuild();

//     this.resume();
//     return this
//   }

//   public remove(...nodes: (string | T)[]) {
//     this.pause();

//     for (let node of nodes) {
//       node = this.getNode(node)
//       const inEdges = this.getInEdges(node);
//       const outEdges = this.getOutEdges(node);

//       super.removeNode(node);
//       this.queue.remove(node)

//       for (const srcId of inEdges) {
//         for (const tgtId of outEdges) {
//           if (srcId === tgtId) continue;
//           try {
//             this.addEdge(srcId, tgtId, this.edgeWeights.get(node.id)?.get(tgtId) ?? 1);
//           } catch {
//           }

//           const subdag = this.subgraph(tgtId)
//           for (const [, node] of subdag.nodes) {
//             node.status = Status.Waiting
//             this.queue.push(node)
//           }
//         }
//       }
//     }

//     this.order();
//     this.queue.rebuild();

//     this.resume();
//     return this;
//   }

//   public push(schema: Schema<T>) {
//     this.pause();

//     for (const { source, target, weight = 1 } of (schema.edges ?? [])) {
//       super.addEdge(source, target, weight);
//     }

//     for (const node of (schema.nodes ?? [])) {
//       const outEdges = this.getOutEdges((node as any).label);

//       for (const tgtId of outEdges) {
//         const subdag = this.subgraph(tgtId)
//         for (const [, n] of subdag.nodes) {
//           n.status = Status.Waiting
//           this.queue.push(n)
//         }
//       }

//       this.queue.push(this.getNode((node as any).label))
//     }

//     this.order();
//     this.queue.rebuild();

//     this.resume();
//     return this;
//   }

//   public pause() {
//     this.paused = true;

//     if (this.workCallTimeout !== null) {
//       clearTimeout(this.workCallTimeout);
//       this.workCallTimeout = null;
//     }
//   }

//   public resume() {
//     if (!this.paused) return;
//     this.paused = false;
//     this.work();
//   }

//   public observe(element: HTMLElement, node: T) {
//     this.addNode(node);
//     this.mountedNodes.set(element, node)
//     this.observer.observe(element)
//   }

//   public unobserve(element: HTMLElement) {
//     const node = this.mountedNodes.get(element)!
//     this.removeNode(node)
//     this.mountedNodes.delete(element)
//     this.observer.unobserve(element)
//   }

//   private batchUpdateWeight(node: T, weight: number) {
//     const existing = this.pendingWeightUpdates.get(node);
//     if (existing === weight) return;

//     this.pendingWeightUpdates.set(node, weight);

//     if (this.weightUpdateScheduled) return;
//     this.weightUpdateScheduled = true;

//     requestIdleCallback(() => {
//       this.pause();

//       for (const [node, weight] of this.pendingWeightUpdates) {
//         const tgtId = this.resolveId(node)
//         for (const srcId of this.getInEdges(node)) {
//           this.edgeWeights.get(srcId)?.set(tgtId, weight);
//         }
//       }

//       this.pendingWeightUpdates.clear();
//       this.markDirty(Dirty.Topo | Dirty.Reach);

//       this.order();
//       this.queue.rebuild();
//       this.resume();

//       this.weightUpdateScheduled = false;
//     });
//   }

//   private async work(node?: T): Promise<void> {
//     if (this.paused) return;

//     if (this.workCallTimeout === null) {
//       const now = Date.now();

//       this.nextWorkCall = Math.max(
//         this.nextWorkCall + WORK_CALL_INTERVAL_LIMIT,
//         now,
//       );

//       const timeUntilNextWorkCall = this.nextWorkCall - now;
//       this.workCallTimeout = setTimeout(
//         () => {
//           this.workCallTimeout = null;
//           this.doWork();
//         },
//         timeUntilNextWorkCall,
//       );
//     }
//   }

//   private async doWork(parent?: T, node?: T) {
//     if (this.queue.size === 0) {
//       if (this.workersBusy.size === 0) { }
//       return;
//     }

//     node = node ?? this.queue.peek();
//     if (!node) {
//       // skip, there are items in the queue but they are all delayed
//       return;
//     }

//     if (this.workersAvail.length === 0) {
//       if (this.allowedToStartWorker()) {
//         await this.launchWorker();
//         this.work();
//       }
//       return;
//     }

//     node = this.queue.poll()
//     const worker = this.workersAvail.shift() as Worker<T>;
//     this.workersBusy.add(worker);

//     if (this.workersAvail.length !== 0 || this.allowedToStartWorker()) {
//       if (parent) {
//         const edges = this.getOutEdges(parent)
//         const allowNode = maxBy(
//           Array.from(edges).filter(edge => edge !== node.id)
//             .map(this.getNode), (node: T) => node._priority
//         )
//         if (allowNode && this.runningEdges < this.options.maxConcurrency) {
//           this.runningEdges++
//           this.queue.remove(allowNode)
//           this.work(parent, allowNode);
//         }
//       }
//     }

//     await worker.handle(node);

//     this.workersBusy.delete(worker);
//     this.workersAvail.push(worker);

//     this.work();
//   }

//   private launchWorker() {
//     this.workersStarting += 1;

//     const worker = new Worker<T>(this);
//     this.workers.push(worker);
//     this.workersAvail.push(worker);

//     this.workersStarting -= 1;

//   }

//   private allowedToStartWorker(): boolean {
//     const workerCount = this.workers.length + this.workersStarting;
//     return (this.options.maxConcurrency === 0
//       || workerCount < this.options.maxConcurrency)
//   }
// }

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
      await Promise.resolve(node.fetchData());
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

  fetchData(): void;
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
    this.pause();

    const tgtId = input.id
    for (const srcId of this.getInEdges(input)) {

    }

    const subdag = this.subgraph(input)

    for (const [, node] of subdag.nodes) {
      node.loading = false;
      if (node.visible) node.priority = 4
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
    if (this.size === this.counts) {
      clearInterval(this.checkForWorkInterval);
      const order = this.order()
      // this.queue.push(...order)
      this.initialized = true
      console.log(order.map(i => ({ name: (i as any).name, _p: i._priority, p: i.priority })))
      // this.work()
    }
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

