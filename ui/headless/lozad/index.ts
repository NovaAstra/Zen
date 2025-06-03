export interface Options {
  intersectionObserverInit: IntersectionObserverInit;
}

export class Queue {

}

export class Memory {

}

export class Scheduler {

}

export class Lozad<P, T> {
  public observer: IntersectionObserver;

  public readonly components: P[] = [];

  private initialized: boolean = false;

  private mountedElements: WeakMap<HTMLElement, T> = new WeakMap();

  public constructor(options: Partial<Options> = {}) { }

  public observe(element: HTMLElement, data?: T) {
    this.observer.observe(element);
    this.mountedElements.set(element, data);
  }

  public dispose() {
    this.initialized = false;

    this.observer.disconnect();
    this.mountedElements = new WeakMap();
  }
}