import type { Primitive, Typed, TypedArray } from "@zen-core/typist"

export const typed = (input: unknown): Typed => {
  if (input === null) return 'Null'
  if (input === undefined) return 'Undefined'
  if (typeof input === 'number' && Number.isNaN(input)) return 'NaN';

  const raw = Object.prototype.toString.call(input).slice(8, -1); // "[object Type]"
  switch (raw) {
    case 'AsyncFunction':
      return 'Promise';
    default:
      return raw as Typed;
  }
}

export const isPrimitive = (input: unknown): input is Primitive =>
  input === undefined
  || input === null
  || (typeof input !== 'object' && typeof input !== 'function')

export const isPrototype = (input: unknown): boolean => {
  if (typeof input !== 'object' || input === null) return false;
  const constructor = (input as object).constructor;
  return input === (typeof constructor === 'function' ? constructor.prototype : Object.prototype);
}

export const isLength = (input: unknown): boolean => Number.isSafeInteger(input) && (input as number) >= 0;

export const isString = (input: unknown): input is string => typed(input) === 'String'

export const isNull = (input: unknown): input is null => typed(input) === 'Null'

export const isNil = (input: unknown): input is null | undefined => {
  const type = typed(input);
  return type === 'Null' || type === 'Undefined';
}

export const isNumber = (input: unknown): input is number => typed(input) === 'Number'

export const isSymbol = (input: unknown): input is symbol => typed(input) === 'Symbol'

export const isBoolean = (input: unknown): input is boolean => typed(input) === 'Boolean'

export const isBigInt = (input: unknown): input is bigint => typed(input) === 'BigInt';

export const isPromise = (input: unknown): input is Promise<unknown> => typed(input) === 'Promise';

export const isDate = (input: unknown): input is Date => typed(input) === 'Date'

export const isFunction = (input: unknown): input is Function => typed(input) === 'Function';

export const isNode = (): boolean => typeof process !== 'undefined' && process?.versions != null && process.versions.node != null;

export const isBrowser = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined' && window.document === document;

export const isArrayLike = (input: unknown): input is ArrayLike<unknown> =>
  input != null && !isFunction(input) && isLength((input as ArrayLike<unknown>).length);

export const isTypedArray = (input: unknown): input is TypedArray =>
  ArrayBuffer.isView(input) && !(input instanceof DataView);

export const isArguments = (input: unknown): input is IArguments => typed(input) === 'Arguments';

export const isError = (input: unknown): input is Error => typed(input) === 'Error';

export const isEmpty = (input: unknown): boolean => {
  if (input == null || input === true || input === false) return true;

  if (isNumber(input)) return input === 0
  if (isDate(input)) return isNaN(input.getTime())
  if (isFunction(input)) return false

  if (isArrayLike(input)) return (input as ArrayLike<unknown>).length === 0;

  if (typeof input === "object") {
    const size = (input as { size?: unknown }).size;
    if (typeof size === "number") return size === 0;
    return Object.keys(input as object).length === 0;
  }
  return false
}