import { Signal } from "./signal"

export function reactive<T>(initialValue?: T) {
  const signal = new Signal<T>(initialValue as T)
  return
}

const count = reactive(1)