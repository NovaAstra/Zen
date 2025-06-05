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

export class Scroll {

}

export class Scheduler {
  private running: boolean = false;

  private idleCallbackId: number;

  public launch() {

  }

  public schedule() {
    if (this.idleCallbackId) cancelIdleCallback(this.idleCallbackId);

    this.idleCallbackId = requestIdleCallback((deadline: IdleDeadline) => {
      this.handle(deadline);
    })
  }

  public terminate() {
    if (this.idleCallbackId) {
      cancelIdleCallback(this.idleCallbackId);
      this.idleCallbackId = undefined;
    }
    this.running = false;
  }

  private handle(deadline: IdleDeadline) {
    this.running = true;
  }
}

export class Lozad<P extends Component, T extends Metric> extends Scheduler {
  public observer: IntersectionObserver;

  public readonly components: P[] = [];

  private initialized: boolean = false;

  private mountedElements: WeakMap<Element, T> = new WeakMap();

  public constructor(options: Partial<Options> = {}) {
    super()
  }

  public bootstrap() {
    if (this.initialized) return;

    this.observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      const now = Date.now();

      for (const { target, isIntersecting } of entries) {
        if (!this.mountedElements.has(target)) continue;

        const metric = this.mountedElements.get(target);
        if (isIntersecting) {
          metric.lastVisited = now;
          metric.visitedCount += 1;
          metric.status = Visibility.Visible;
          this.mountedElements.set(target, metric);
          continue;
        }

        metric.status = Visibility.Hidden;
        this.mountedElements.set(target, metric);
      }
    });

    this.initialized = true;
  }

  public observe(element: Element, data: T) {
    if (!this.initialized) this.launch();

    this.observer.observe(element);
    this.mountedElements.set(element, { ...data, visitedCount: 0 });
  }

  public dispose() {
    this.initialized = false;

    this.observer.disconnect();
    this.mountedElements = new WeakMap();
  }
}