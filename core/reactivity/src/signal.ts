import { type Link, type Flags, type Node } from "./dependency";
import { Deque } from "@zen-core/linky";

export class Signal<T> implements Node {
  protected _value: T;
  public previousValue: T;

  public flags: Flags = 1 satisfies Flags.Mutable;

  public readonly deps = new Deque<Link>();
  public readonly subs = new Deque<Link>();

  public constructor(initialValue: T) {
    this._value = this.previousValue = initialValue;
  }
}

Object.defineProperty(Signal.prototype, 'value', {
  get<T>(this: Signal<T>): T {
    return this._value;
  },
  set<T>(this: Signal<T>, value: T) {
    if (Object.is(this._value, value)) return;
    this._value = value;
  },
  configurable: true,
  enumerable: true
})
