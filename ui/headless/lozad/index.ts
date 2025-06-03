export interface Options {
  intersectionObserverInit: IntersectionObserverInit;
}

export interface VisibilityMetric {
  lastVisited?: number;
  visitedCount?: number;
}

export class Queue {

}

export class Memory {

}

export class Scheduler {

}

export class Lozad<P, T extends VisibilityMetric> {
  public observer: IntersectionObserver;

  public readonly components: P[] = [];

  private initialized: boolean = false;

  private mountedElements: WeakMap<Element, T> = new WeakMap();

  public constructor(options: Partial<Options> = {}) { }

  public launch() {
    if (this.initialized) return;

    this.observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      const now = Date.now();

      for (const { target, isIntersecting } of entries) {
        if (!this.mountedElements.has(target)) continue;

        const element = this.mountedElements.get(target);
        if (isIntersecting) {
          element.lastVisited = now;
          element.visitedCount = (element.visitedCount || 0) + 1
          this.mountedElements.set(target, element);
        }
      }
    });

    this.initialized = true;
  }

  public observe(element: Element, data?: T) {
    if (!this.initialized) this.launch();

    this.observer.observe(element);
    this.mountedElements.set(element, data);
  }

  public dispose() {
    this.initialized = false;

    this.observer.disconnect();
    this.mountedElements = new WeakMap();
  }
}