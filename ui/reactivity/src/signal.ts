import { type Flags } from "./dependency";

export class Signal<T> {
  public value: T;

  public previousValue: T;

  public flags: Flags = 1 satisfies Flags.Mutable;

  public constructor(initialValue: T) {
    this.value = initialValue;
    this.previousValue = initialValue;
  }

  public set(value: T) { }

  public get(): T {
    return this.value
  }
}