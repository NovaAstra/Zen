
export interface Widget {
  gadgetId: string;
}

export interface Node extends Widget {
  status: Status;
  global: boolean;
  deps: Set<string>;
  subs: Set<string>
}

export enum Status {
  Waiting,
  Pending,
  Success,
  Failed,
  Silent
}

export class Dependency {
  private readonly nodes: Map<string, Node> = new Map();

  public register(node: Node | Widget, global: boolean = false) {
    if (!this.nodes.has(node.gadgetId)) {
      this.nodes.set(node.gadgetId, {
        ...node,
        deps: new Set(),
        subs: new Set(),
        status: global ? Status.Pending : Status.Waiting,
        global
      });
    }

    return this;
  }

  public link(depId: string, subId: string) {
    const dep = this.nodes.get(depId);
    const sub = this.nodes.get(subId);
    if (dep && sub) {
      dep.subs.add(subId);
      sub.deps.add(depId);
    }
    return this;
  }

  public unlink(depId: string, subId: string) {
    const dep = this.nodes.get(depId);
    const sub = this.nodes.get(subId);
    if (dep && sub) {
      dep.subs.delete(subId);
      sub.deps.delete(depId);
    }
    return this;
  }
}

export class Lozad extends Dependency {
  private observer: IntersectionObserver;

  public constructor(public readonly widgets: Widget[]) {
    super()
  }

  public on(callback: () => void) {
    callback()
  }

  public emit(gadgetId: string, status: Status) { }

  public observe(element: HTMLElement, widget: Widget) {
    this.observer.observe(element);
  }

  public dispose() {
    this.observer.disconnect();
  }

  private tryActivate() { }
}

const sleep = (mill: number) => new Promise((resolve) => setTimeout(resolve, mill * 1000))

const lozad = new Lozad([
  { gadgetId: 'a' }, { gadgetId: 'b' },
  { gadgetId: 'c' }, { gadgetId: 'd' },
  { gadgetId: 'e' }, { gadgetId: 'f' },
])

const A = async () => { await sleep(2); console.log('A'); return lozad.emit('a', Status.Success) };
const B = async () => { await sleep(3); console.log('B'); return lozad.emit('b', Status.Success) };
const C = async () => { await sleep(4); console.log('C'); return lozad.emit('c', Status.Success) };
const D = async () => { await sleep(5); console.log('D'); return lozad.emit('d', Status.Success) };
const E = async () => { await sleep(6); console.log('E'); return lozad.emit('e', Status.Success) };
const F = async () => { await sleep(2); console.log('F'); return lozad.emit('f', Status.Success) };

lozad
  .link('a', 'b')
  .link('a', 'c')
  .link('e', 'f')
  .link('c', 'f')
  .on(() => {
    console.log('lozad finished')
  })

async function bootstrap() {
  await Promise.all([
    A(),
    B(),
    C(),
    D(),
    E(),
    F(),
  ])
}