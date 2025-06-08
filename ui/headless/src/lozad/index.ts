import { StatefulDAG, StatefulNode, Status, Direction } from "@zen-core/graph"
import { PriorityQueue } from "@zen-core/queue"

export {
  StatefulDAG, StatefulNode, Status
}

export interface Options {
  intersectionObserverInit: IntersectionObserverInit;
}

export interface Metric {
  lastVisited?: number;
  visitedCount?: number;
  status: Visibility;
}

export interface Component {

}

export interface Task {

}

export enum Visibility {
  Hidden,
  Visible
}


export class Memory {
  public constructor(public readonly lozad: Lozad<Component, Metric>) { }
}

export class Scroll<D, T extends StatefulNode<D>> {
  public scrolling: boolean = false;

  public version: number = 0;

  public constructor(
    public readonly dag: StatefulDAG<D, T>,
    public readonly queue: PriorityQueue<T>,
  ) { }

  public onScroll() { }

  public onScrollStart() {
    this.scrolling = true;

    this.dag.pause();
    this.queue.clear();
    this.version++;
  }

  public onScrollEnd() {
    this.scrolling = false;

    this.dag.resume();
  }
}

export class Scheduler<D, T extends StatefulNode<D>> extends StatefulDAG<D, T> {
  constructor() {
    super();
  }
}


export class Lozad<P extends Component, T extends Metric> {
  public observer!: IntersectionObserver;

  public readonly components: P[] = [];

  private initialized: boolean = false;

  private mountedElements: WeakMap<Element, T> = new WeakMap();


  public constructor(options: Partial<Options> = {}) {
  }

  public bootstrap() {
    if (this.initialized) return;

    this.observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      const now = Date.now();

      for (const { target, isIntersecting } of entries) {
        if (!this.mountedElements.has(target)) continue;
      }
    });

    this.initialized = true;
  }

  public observe(element: Element, data: T) {
    this.observer.observe(element);
    this.mountedElements.set(element, { ...data, visitedCount: 0 });
  }

  public dispose() {
    this.initialized = false;

    this.observer.disconnect();
    this.mountedElements = new WeakMap();
  }
}