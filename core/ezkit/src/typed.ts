import type { Primitive, Typed, TypedArray } from "@zen-core/typist"

const primitive = ['Null', 'Undefined', 'String', 'Number', 'Boolean', 'Symbol', 'BigInt']

export const typed = (value: unknown): Typed => {
  if (value === null) return 'Null'
  if (value === undefined) return 'Undefined'
  if (typeof value === 'number' && Number.isNaN(value)) return 'NaN';

  const raw = Object.prototype.toString.call(value).slice(8, -1)
  return raw === 'AsyncFunction' ? 'Promise' : raw
}

export const isPrimitive = (value: unknown): value is Primitive => primitive.includes(typed(value))

export const isPrototype = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) return false;

  const constructor = value.constructor;
  const prototype = typeof constructor === 'function' ? constructor.prototype : Object.prototype;

  return value === prototype;
}

export const isLength = (value: unknown): boolean => Number.isSafeInteger(value) && (value as number) >= 0;

export const isString = (value: unknown): value is string => typed(value) === 'String'

export const isNull = (value: unknown): value is null => typed(value) === 'Null'

export const isNil = (value: unknown): value is null | undefined => ['Null', 'Undefined'].includes(typed(value))

export const isNumber = (value: unknown): value is number => typed(value) === 'Number'

export const isSymbol = (value: unknown): value is symbol => typed(value) === 'Symbol'

export const isBoolean = (value: unknown): value is boolean => typed(value) === 'Boolean'

export const isBigInt = (value: unknown): value is bigint => typed(value) === 'BigInt';

export const isDate = (value: unknown): value is Date => typed(value) === 'Date'

export const isFunction = (value: unknown): value is Function => typed(value) === 'Function';

export const isNode = (): boolean => typeof process !== 'undefined' && process?.versions != null && process.versions.node != null;

export const isBrowser = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined' && window.document === document;

export const isArrayLike = (value: unknown): value is ArrayLike<unknown> => {
  return !['Null', 'Function'].includes(typed(value)) && isLength((value as ArrayLike<unknown>).length);
}

export const isTypedArray = (value: unknown): value is TypedArray => ArrayBuffer.isView(value) && !(value instanceof DataView);

export const isArguments = (value?: unknown): value is IArguments => typed(value) === 'Arguments';

export const isError = (value: unknown): value is Error => typed(value) === 'Error';

export const isEmpty = (value?: unknown): boolean => {
  if (value === true || value === false) return true
  if (value === null || value === undefined) return true
  if (isNumber(value)) return value === 0
  if (isDate(value)) return isNaN(value.getTime())
  if (isFunction(value)) return false
  if (isSymbol(value)) return false
  if (isArrayLike(value)) return (value as ArrayLike<unknown>).length === 0;
  const size = (value as { size?: unknown })?.size;
  if (typeof size === 'number') return size === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false
}