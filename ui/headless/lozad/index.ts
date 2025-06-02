export interface Widget {
  gadgetId: string;
}

export interface Node extends Widget {
  executionCount: number;
  visibility: Visibility;
  status: Status;
  deps: Map<string, boolean>;  // 存储依赖状态
  subs: Set<string>;
  unsatisfiedDeps: number;  // 未满足依赖计数
}

export interface Widget {
  gadgetId: string;
}

export const enum Status {
  PENDING = 1 << 0,   // 等待运行 (0b0001)
  RUNNING = 1 << 1,   // 正在运行 (0b0010)
  SUCCESS = 1 << 2,   // 运行成功 (0b0100)
  FAILED = 1 << 3,   // 运行失败 (0b1000)

  // 组合状态
  TERMINAL = SUCCESS | FAILED,   // 终态
  ACTIVE = PENDING | RUNNING      // 活动状态
}

export const enum Visibility {
  HIDDEN,   // 不可见
  VISIBLE   // 可见
}

export class Dependency {
  private readonly nodes: Map<string, Node> = new Map();

  public register(widget: Widget) {
    if (!this.nodes.has(widget.gadgetId)) {
      this.nodes.set(widget.gadgetId, {
        ...widget,
        deps: new Map(),
        subs: new Set(),
        unsatisfiedDeps: 0,  // 初始化未满足依赖计数
        executionCount: 0,
        status: Status.PENDING,
        visibility: Visibility.HIDDEN
      });
    }

    return this;
  }

  public link(depId: string, subId: string) {
    const dep = this.nodes.get(depId);
    const sub = this.nodes.get(subId);
    if (dep && sub && !dep.subs.has(subId)) {
      dep.subs.add(subId);
      sub.deps.set(depId, false);
      sub.unsatisfiedDeps++;
    }
    return this;
  }

  public unlink(depId: string, subId: string) {
    const dep = this.nodes.get(depId);
    const sub = this.nodes.get(subId);
    if (dep && sub && dep.subs.has(subId)) {
      dep.subs.delete(subId);
      if (sub.deps.get(depId) === false) {
        sub.unsatisfiedDeps--;
      }
      sub.deps.delete(depId);
    }
    return this;
  }

  public get(gadgetId: string): Node {
    return this.nodes.get(gadgetId);
  }
}

export class Lozad extends Dependency {
  public widgets: Widget[];

  private mountedWidgetWeakMap: WeakMap<HTMLElement, Widget> = new WeakMap();
  private readonly observer: IntersectionObserver;

  private readonly subscribes: Map<string, (() => void)[]> = new Map()

  private initialized: boolean = false;

  public constructor(
    options: IntersectionObserverInit = { threshold: 0.01 }
  ) {
    super()

    this.observer = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) {
        const widget = this.mountedWidgetWeakMap.get(target as HTMLElement);
        if (!widget) continue;

        const node = this.get(widget.gadgetId);
        if (node) {
          // 更新可见状态
          node.visibility = isIntersecting
            ? Visibility.VISIBLE
            : Visibility.HIDDEN;

          if (node.executionCount === 0) {
            this.tryActivateNode(node);
          }
        }
      }
    }, options);
  }

  public launch(widgets: Widget[]) {
    this.widgets = widgets;
    widgets.forEach(widget => { this.register(widget); });
    this.initialized = true;
  }

  public on(callback: () => void): void;
  public on(gadgetId: string, callback: () => void): void;
  public on() {
    const [key, callback] = arguments.length === 1
      ? ['global'].concat(...arguments)
      : arguments;

    const cbs = this.subscribes.get(key) || [];
    cbs.push(callback);
    this.subscribes.set(key, cbs);
  }

  public off(): void;
  public off(gadgetId: string): void;
  public off(gadgetId?: string) {
    if (gadgetId) {
      this.subscribes.delete(gadgetId);
    } else {
      this.subscribes.clear();
    }
  }

  public emit(gadgetId: string, status: Status) {
    const node = this.get(gadgetId);
    if (!node) return;

    const prevStatus = node.status;
    node.status = status;

    const isTerminal = (status & Status.TERMINAL) !== 0;
    const wasTerminal = (prevStatus & Status.TERMINAL) !== 0;

    if (isTerminal && !wasTerminal) {
      const isSuccess = (status & Status.SUCCESS) !== 0;

      // 更新所有依赖此节点的子节点
      for (const subId of node.subs) {
        const sub = this.get(subId);
        if (!sub) continue;

        const prevSatisfied = sub.deps.get(gadgetId);
        if (prevSatisfied !== isSuccess) {
          sub.deps.set(gadgetId, isSuccess);
          sub.unsatisfiedDeps += isSuccess ? -1 : 1;
          this.tryActivateNode(sub);
        }
      }
    }
  }

  public observe(element: HTMLElement, widget: Widget) {
    this.observer.observe(element);
    this.mountedWidgetWeakMap.set(element, widget)
    return this;
  }

  public unobserve(element: HTMLElement) {
    this.observer.unobserve(element);
    this.mountedWidgetWeakMap.delete(element);
    return this;
  }

  public dispose() {
    this.observer.disconnect();
    this.mountedWidgetWeakMap = new WeakMap();
    this.subscribes.clear();
    return this;
  }

  private emitCallbacks(gadgetId: string): void {
    const globalCbs = this.subscribes.get('global') || [];
    const localCbs = this.subscribes.get(gadgetId) || [];
    [...globalCbs, ...localCbs].forEach(cb => cb());
  }

  private tryActivateNode(startNode: Node): void {
    const queue: Node[] = [startNode];

    while (queue.length > 0) {
      const node = queue.shift();
      if (!node || !this.canActivate(node)) continue;

      node.status = Status.RUNNING;
      node.executionCount++;
      this.emitCallbacks(node.gadgetId);

      for (const subId of node.subs) {
        const subNode = this.get(subId);
        if (subNode) queue.push(subNode);
      }
    }
  }

  private canActivate(node: Node): boolean {
    const isPending = (node.status & Status.PENDING) !== 0;
    const isTerminal = (node.status & Status.TERMINAL) !== 0;
    return isPending
      && !isTerminal
      && node.unsatisfiedDeps === 0
      && node.visibility === Visibility.VISIBLE;
  }
}